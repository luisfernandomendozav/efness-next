import twilio from "twilio";

function client() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
}

// Twilio Verify gestiona la generación y expiración de códigos,
// igual que TwilioService en el backend Laravel.
export async function sendVerificationCode(phone: string) {
  try {
    const verification = await client()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: phone, channel: "sms" });
    return verification.status === "pending";
  } catch {
    return false;
  }
}

export async function checkVerificationCode(phone: string, code: string) {
  try {
    const check = await client()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: phone, code });
    return check.status === "approved";
  } catch {
    return false;
  }
}
