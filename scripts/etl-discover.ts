import "dotenv/config";
import { Client } from "pg";
import mysql from "mysql2/promise";

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const my = await mysql.createConnection({
    host: "127.0.0.1", port: 3307, user: "root", password: "secret", database: "efness_bidding",
  });

  const pgTables = (await pg.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
  )).rows.map((r) => r.table_name);

  const [myRows] = await my.query<any[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='efness_bidding' ORDER BY table_name`
  );
  const myTables = myRows.map((r: any) => r.TABLE_NAME ?? r.table_name);

  console.log("PG tables:", pgTables.length);
  console.log("MySQL tables:", myTables.length);
  console.log("En MySQL pero NO en PG (se omiten):", myTables.filter((t: string) => !pgTables.includes(t)).join(", "));
  console.log("En PG pero NO en MySQL:", pgTables.filter((t) => !myTables.includes(t)).join(", ") || "(ninguna)");

  // columnas booleanas, json y enum en PG
  const cols = (await pg.query(
    `SELECT table_name, column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`
  )).rows;
  const bools = cols.filter((c) => c.data_type === "boolean").map((c) => `${c.table_name}.${c.column_name}`);
  const jsons = cols.filter((c) => c.data_type === "json" || c.data_type === "jsonb").map((c) => `${c.table_name}.${c.column_name}`);
  const enums = cols.filter((c) => c.data_type === "USER-DEFINED").map((c) => `${c.table_name}.${c.column_name} (${c.udt_name})`);
  console.log("\nBOOLEAN cols:", bools.join(", "));
  console.log("\nJSON cols:", jsons.join(", ") || "(ninguna)");
  console.log("\nENUM cols:", enums.join(", ") || "(ninguna)");

  await pg.end();
  await my.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
