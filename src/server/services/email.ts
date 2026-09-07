const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/verify?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification link for ${email}: ${verifyUrl}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "efness <noreply@efness.com>",
      to: email,
      subject: "Verifica tu correo electrónico — efness",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <img src="${APP_URL}/efness-logo-color.svg" alt="efness" width="140" style="margin-bottom:32px"/>
          <h2 style="color:#293762;margin:0 0 12px">Hola, ${name}</h2>
          <p style="color:#78829d;margin:0 0 24px">
            Gracias por registrarte en efness. Haz clic en el botón para activar tu cuenta.
          </p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:14px 28px;background:#00E84A;color:#293762;font-weight:700;text-decoration:none;border-radius:10px">
            Verificar mi correo
          </a>
          <p style="color:#969BAF;font-size:13px;margin-top:32px">
            Si no creaste una cuenta en efness, puedes ignorar este mensaje.
          </p>
        </div>
      `,
    }),
  });
}
