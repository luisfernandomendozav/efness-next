const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Correo transaccional vía SendGrid, como EmailSender del backend legacy
// (config/services.php: SENDGRID_API_KEY + SENDGRID_EMAIL_FROM). Sin las
// variables configuradas los correos solo se registran en consola (dev).

export async function sendEmail({
  to,
  toName,
  subject,
  html,
}: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_EMAIL_FROM;
  if (!apiKey || !from) {
    console.log(`[DEV] Email para ${to} — "${subject}" (SendGrid sin configurar)`);
    return true;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        { to: [{ email: to, ...(toName ? { name: toName } : {}) }] },
      ],
      from: {
        email: from,
        name: process.env.SENDGRID_EMAIL_FROM_NAME ?? "Efness Company",
      },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  // SendGrid responde 202 Accepted cuando encola el envío.
  if (res.status !== 202) {
    console.error(`SendGrid ${res.status} enviando a ${to}: ${await res.text()}`);
    return false;
  }
  return true;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/verify?token=${token}`;

  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[DEV] Verification link for ${email}: ${verifyUrl}`);
    return;
  }

  await sendEmail({
    to: email,
    toName: name,
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
  });
}
