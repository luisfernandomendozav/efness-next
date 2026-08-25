import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword } from "./password";
import { sendVerificationCode } from "@/server/services/sms";
import { authConfig } from "./config";

// Errores con código para que la UI muestre el mensaje correcto,
// replicando las respuestas 401/403/500 del LoginController de Laravel.
class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) throw new LoginError("invalid_credentials");
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: { role: true },
        });
        if (!user) throw new LoginError("invalid_credentials");

        const valid = await verifyPassword(password, user.password);
        if (!valid) throw new LoginError("invalid_credentials");

        if (!user.emailVerifiedAt) throw new LoginError("email_not_verified");
        if (user.passwordExpiry && user.passwordExpiry < new Date()) {
          throw new LoginError("password_expired");
        }
        if (user.accountStatus === "deactivated") {
          throw new LoginError("account_disabled");
        }

        let twoFactorPending = false;
        if (user.twoFactorAuthenticationEnabled) {
          const phone = `${user.celPhoneCountryCode ?? ""}${user.celPhone ?? ""}`;
          const sent = await sendVerificationCode(phone);
          if (!sent) throw new LoginError("code_send_failed");
          twoFactorPending = true;
        }

        return {
          id: String(user.id),
          name: `${user.name} ${user.lastName}`,
          email: user.email,
          image: user.avatar,
          role: user.role?.name ?? null,
          roleId: user.roleId,
          userTypeId: user.userTypeId,
          companyId: user.companyId,
          twoFactorPending,
        };
      },
    }),
  ],
});
