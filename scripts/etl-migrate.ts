import "dotenv/config";
import { Client } from "pg";
import mysql from "mysql2/promise";

const CHUNK = 500;
const BAD_DATES = new Set(["0000-00-00 00:00:00", "0000-00-00"]);

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const my = await mysql.createConnection({
    host: "127.0.0.1", port: 3307, user: "root", password: "secret",
    database: "efness_bidding", dateStrings: true, supportBigNumbers: true, bigNumberStrings: true,
  });

  // --- metadata de PG ---
  const pgTables: string[] = (await pg.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'`
  )).rows.map((r) => r.table_name);

  const pgCols = (await pg.query(
    `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public'`
  )).rows;
  const pgColsByTable = new Map<string, Map<string, string>>();
  for (const c of pgCols) {
    if (!pgColsByTable.has(c.table_name)) pgColsByTable.set(c.table_name, new Map());
    pgColsByTable.get(c.table_name)!.set(c.column_name, c.data_type);
  }

  // --- FKs: guardar def y dropear ---
  const fks = (await pg.query(
    `SELECT conrelid::regclass::text AS tbl, conname, pg_get_constraintdef(oid) AS def
     FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace`
  )).rows;
  console.log(`Dropeando ${fks.length} FKs...`);
  for (const fk of fks) {
    await pg.query(`ALTER TABLE ${fk.tbl} DROP CONSTRAINT "${fk.conname}"`);
  }

  // --- truncar destino ---
  for (const t of pgTables) await pg.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY`);

  // --- copiar tabla por tabla ---
  let totalRows = 0;
  const report: Record<string, number> = {};
  for (const t of pgTables) {
    const pgTableCols = pgColsByTable.get(t)!;
    // columnas en MySQL
    const [myColRows] = await my.query<any[]>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='efness_bidding' AND table_name=?`, [t]
    );
    const myColNames = new Set(myColRows.map((r: any) => (r.COLUMN_NAME ?? r.column_name)));
    if (myColRows.length === 0) { report[t] = 0; continue; } // tabla no existe en MySQL

    const cols = [...pgTableCols.keys()].filter((c) => myColNames.has(c));
    const [rows] = await my.query<any[]>(`SELECT ${cols.map((c) => `\`${c}\``).join(",")} FROM \`${t}\``);
    if (rows.length === 0) { report[t] = 0; continue; }

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const params: any[] = [];
      const valuesSql = chunk.map((row: any) => {
        const ph = cols.map((c) => {
          let v = row[c];
          const type = pgTableCols.get(c)!;
          if (v !== null && v !== undefined) {
            if (type === "boolean") v = Number(v) !== 0;
            else if (type === "json" || type === "jsonb") v = typeof v === "object" ? JSON.stringify(v) : v;
            else if ((type.includes("timestamp") || type === "date") && typeof v === "string" && BAD_DATES.has(v.trim())) v = null;
          }
          params.push(v);
          return `$${params.length}`;
        });
        return `(${ph.join(",")})`;
      }).join(",");
      await pg.query(
        `INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES ${valuesSql}`,
        params
      );
    }
    report[t] = rows.length;
    totalRows += rows.length;
  }

  // --- recrear FKs ---
  console.log(`Recreando ${fks.length} FKs...`);
  for (const fk of fks) {
    await pg.query(`ALTER TABLE ${fk.tbl} ADD CONSTRAINT "${fk.conname}" ${fk.def}`);
  }

  // --- resetear secuencias ---
  let seqReset = 0;
  for (const t of pgTables) {
    if (!pgColsByTable.get(t)!.has("id")) continue;
    const seq = (await pg.query(`SELECT pg_get_serial_sequence('public."${t}"','id') AS s`)).rows[0].s;
    if (!seq) continue;
    await pg.query(`SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM "${t}"), 1), (SELECT COUNT(*) FROM "${t}") > 0)`);
    seqReset++;
  }

  console.log("\n=== RESUMEN ===");
  console.log(`Total filas migradas: ${totalRows}`);
  console.log(`Secuencias reseteadas: ${seqReset}`);
  const withData = Object.entries(report).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  for (const [t, n] of withData) console.log(`  ${t}: ${n}`);
  const empty = Object.entries(report).filter(([, n]) => n === 0).map(([t]) => t);
  console.log(`Tablas vacías: ${empty.length} (${empty.join(", ")})`);

  await pg.end();
  await my.end();
}
main().catch((e) => { console.error("ETL FALLÓ:", e); process.exit(1); });
