import { notFound } from "next/navigation";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getBusinessProfile } from "@/server/account-business";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import {
  CategoriesForm,
  GeoScopesForm,
} from "@/components/account/business-profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AccountPage() {
  const [t, session] = await Promise.all([getT(), auth()]);
  const userId = Number(session!.user.id);

  const [user, business] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        lastName: true,
        email: true,
        phoneCountryCode: true,
        phone: true,
      },
    }),
    getBusinessProfile(userId),
  ]);
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">{t("Account Settings")}</h1>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("Profile")}</TabsTrigger>
          <TabsTrigger value="business">
            {t("Geographic zone and business line")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4 space-y-5">
          <ProfileForm
            name={user.name}
            lastName={user.lastName}
            email={user.email}
            phoneCountryCode={user.phoneCountryCode}
            phone={user.phone}
          />
          <PasswordForm />
        </TabsContent>
        <TabsContent value="business" className="mt-4 space-y-5">
          <CategoriesForm
            categories={business.categories}
            selectedCategoryIds={business.selectedCategoryIds}
          />
          <GeoScopesForm
            countries={business.countries}
            states={business.states}
            scopes={business.scopes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
