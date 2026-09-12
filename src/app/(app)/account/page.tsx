import { notFound } from "next/navigation";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";

export default async function AccountPage() {
  const [t, session] = await Promise.all([getT(), auth()]);

  const user = await db.user.findUnique({
    where: { id: Number(session!.user.id) },
    select: {
      name: true,
      lastName: true,
      email: true,
      phoneCountryCode: true,
      phone: true,
    },
  });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">{t("Account Settings")}</h1>
      <ProfileForm
        name={user.name}
        lastName={user.lastName}
        email={user.email}
        phoneCountryCode={user.phoneCountryCode}
        phone={user.phone}
      />
      <PasswordForm />
    </div>
  );
}
