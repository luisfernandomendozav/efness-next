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
  }
}
