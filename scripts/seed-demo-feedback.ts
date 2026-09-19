import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Usuarios de demostración para verificar el feedback de las notas del
// 2026-09-18 (capturas del PR). Todos con contraseña Secret123!.
//  - demo.comprador@efness.dev  (comprador, Empresa Demo Feedback)
//  - demo.colega@efness.dev     (comprador, misma empresa)
//  - demo.superadmin@efness.dev (superadmin)

const db = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  const hash = (await bcrypt.hash("Secret123!", 10)).replace(/^\$2b\$/, "$2y$");

  const company = await db.company.upsert({
    where: { rfcTaxId: "DEMO260918AB1" },
    update: {},
    create: {
      name: "Empresa Demo Feedback",
      rfcTaxId: "DEMO260918AB1",
      country: "Mexico",
      state: "Sonora",
      city: "Hermosillo",
      address: "Blvd. Demo 123",
      zipCode: "83000",
    },
  });

  const users: Array<{
    email: string;
    name: string;
    lastName: string;
    userTypeId: number | null;
    roleId: number;
    companyId: number | null;
  }> = [
    {
      email: "demo.comprador@efness.dev",
      name: "Diana",
      lastName: "Demo Compradora",
      userTypeId: 2,
      roleId: 2,
      companyId: company.id,
    },
    {
      email: "demo.colega@efness.dev",
      name: "Carlos",
      lastName: "Demo Colega",
      userTypeId: 2,
      roleId: 2,
      companyId: company.id,
    },
    {
      email: "demo.superadmin@efness.dev",
      name: "Admin",
      lastName: "Demo",
      userTypeId: 1,
      roleId: 1,
      companyId: company.id,
    },
  ];

  for (const u of users) {
    const row = await db.user.upsert({
      where: { email: u.email },
      update: { password: hash, accountStatus: "active" },
      create: {
        ...u,
        password: hash,
        emailVerifiedAt: new Date(),
        accountStatus: "active",
        twoFactorAuthenticationEnabled: false,
        language: "es",
      },
    });
    console.log("seeded:", row.email, "id:", row.id);
  }
}

main().finally(() => db.$disconnect());
