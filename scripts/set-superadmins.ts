// Los datos migrados del legacy traían role_id = 1 (superadmin) para TODOS
// los usuarios, lo que hacía que cualquier usuario viera Gestión de usuarios,
// todas las requisiciones y todos los catálogos. Este script deja como
// superadmin solo a los correos de la lista y baja al resto a admin (2).
//
// Uso: pnpm exec tsx scripts/set-superadmins.ts [correo1 correo2 ...]
import "dotenv/config";
import { Client } from "pg";

const DEFAULT_SUPERADMINS = [
  "erick.evangelista@gilasw.com",
  "roberto.pallanez@gilasw.com",
  "juan@gilasw.com",
];

async function main() {
  const superadmins = process.argv.slice(2).length
    ? process.argv.slice(2)
    : DEFAULT_SUPERADMINS;

  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();

  const demoted = await pg.query(
    `UPDATE users SET role_id = 2 WHERE role_id = 1 AND NOT (email = ANY($1)) RETURNING email`,
    [superadmins],
  );
  const promoted = await pg.query(
    `UPDATE users SET role_id = 1 WHERE email = ANY($1) RETURNING email`,
    [superadmins],
  );

  console.log(`Superadmins (${promoted.rowCount}):`, promoted.rows.map((r) => r.email));
  console.log(`Bajados a admin: ${demoted.rowCount}`);
  await pg.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
