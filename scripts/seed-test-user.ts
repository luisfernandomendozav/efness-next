import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  // Hash con prefijo $2y$ para simular exactamente lo que produce Laravel
  const hash = (await bcrypt.hash("Secret123!", 10)).replace(/^\$2b\$/, "$2y$");
  const user = await db.user.upsert({
    where: { email: "test@efness.dev" },
    update: { password: hash },
    create: {
      name: "Test",
      lastName: "User",
      email: "test@efness.dev",
      password: hash,
      emailVerifiedAt: new Date(),
      accountStatus: "active",
      twoFactorAuthenticationEnabled: false,
      language: "es",
    },
  });
  console.log("seeded user id:", user.id, "hash prefix:", hash.slice(0, 4));
}

main().finally(() => db.$disconnect());
