import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string | null;
      roleId: number | null;
      userTypeId: number | null;
      companyId: number | null;
      twoFactorPending: boolean;
      // Id del superadmin original cuando la sesión está impersonando a
      // otro usuario ("Acceder como", feedback notas 2026-09-18).
      impersonatorId: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: string | null;
    roleId: number | null;
    userTypeId: number | null;
    companyId: number | null;
    twoFactorPending: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string | null;
    roleId?: number | null;
    userTypeId?: number | null;
    companyId?: number | null;
    twoFactorPending?: boolean;
    impersonatorId?: number | null;
  }
}
