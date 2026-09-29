import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="text-center">
        <h2 className="mb-3 text-2xl font-bold text-white">Enlace inválido</h2>
        <p className="mb-8 text-white/60">
          El enlace para restablecer la contraseña no es válido o está
          incompleto. Solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-[#00E84A] text-[#293762] font-bold hover:bg-[#00E84A]/90 transition-colors"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}
