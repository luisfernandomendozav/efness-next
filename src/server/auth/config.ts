import type { NextAuthConfig } from "next-auth";

// Config base sin providers: se comparte entre el runtime completo
// (src/server/auth/index.ts) y el proxy, que solo necesita leer el JWT.
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleId = user.roleId;
        token.userTypeId = user.userTypeId;
        token.companyId = user.companyId;
        token.twoFactorPending = user.twoFactorPending;
      }
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string | null;
      session.user.roleId = token.roleId as number | null;
      session.user.userTypeId = token.userTypeId as number | null;
      session.user.companyId = token.companyId as number | null;
      session.user.twoFactorPending = token.twoFactorPending as boolean;
      return session;
    },
  },
} satisfies NextAuthConfig;
