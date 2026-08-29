import "dotenv/config";
import { Client } from "pg";
import mysql from "mysql2/promise";

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const my = await mysql.createConnection({
    host: "127.0.0.1", port: 3307, user: "root", password: "secret", database: "efness_bidding",
  });

  const pgTables: string[] = (await pg.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'`
  )).rows.map((r) => r.table_name);

  let mismatches = 0;
  for (const t of pgTables) {
    const [myR] = await my.query<any[]>(`SELECT COUNT(*) c FROM \`${t}\``).catch(() => [[{ c: -1 }]] as any);
    const myC = Number((myR as any[])[0].c);
    const pgC = Number((await pg.query(`SELECT COUNT(*) c FROM "${t}"`)).rows[0].c);
    if (myC !== pgC) { console.log(`  MISMATCH ${t}: mysql=${myC} pg=${pgC}`); mismatches++; }
  }
  console.log(mismatches === 0 ? "✅ Todos los conteos coinciden" : `❌ ${mismatches} discrepancias`);

  // spot check usuarios: hash bcrypt y campos clave
  const u = (await pg.query(`SELECT id, email, LEFT(password,4) AS hp, email_verified_at IS NOT NULL AS verif, account_status FROM users ORDER BY id LIMIT 3`)).rows;
  console.log("\nMuestra users:");
  for (const r of u) console.log(`  #${r.id} ${r.email} hash=${r.hp} verificado=${r.verif} status=${r.account_status}`);

  // verificar una FK real: biddings.created_by -> users
  const orphan = (await pg.query(`SELECT COUNT(*) c FROM biddings b LEFT JOIN users u ON b.created_by=u.id WHERE u.id IS NULL`)).rows[0].c;
  console.log(`\nBiddings con created_by huérfano: ${orphan}`);

  await pg.end();
  await my.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
