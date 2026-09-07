import Link from "next/link";
import { db } from "@/server/db";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Result
        ok={false}
        title="Enlace inválido"
        message="El enlace de verificación no es válido o está incompleto."
      />
    );
  }

  const user = await db.user.findFirst({
    where: { verificationToken: token },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user) {
    return (
      <Result
        ok={false}
        title="Enlace expirado"
        message="Este enlace ya fue utilizado o no es válido. Si aún no verificaste tu cuenta, contacta a soporte."
      />
    );
  }

  if (!user.emailVerifiedAt) {
    await db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), verificationToken: null },
    });
  }

  return (
    <Result
      ok={true}
      title="¡Correo verificado!"
      message="Tu cuenta está activa. Ya puedes iniciar sesión."
    />
  );
}

function Result({
  ok,
  title,
  message,
}: {
  ok: boolean;
  title: string;
  message: string;
}) {
  return (
    <div className="text-center">
      <div
        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
          ok ? "bg-[#00E84A]/15" : "bg-red-500/15"
        }`}
      >
        {ok ? (
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-[#00E84A]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <h2 className="mb-3 text-2xl font-bold text-white">{title}</h2>
      <p className="mb-8 text-white/60">{message}</p>

      <Link
        href="/login"
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-[#00E84A] text-[#293762] font-bold hover:bg-[#00E84A]/90 transition-colors"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}
