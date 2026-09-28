import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getBusinessProfile } from "@/server/account-business";
import {
  getCompanyDetails,
  getCompanySuperadmin,
  getCompanyUsers,
  getDeliveryAddresses,
  getSubscriptionInfo,
} from "@/server/account-data";
import { AddressesCard } from "@/components/account/addresses-card";
import { AvatarForm } from "@/components/account/avatar-form";
import { CompanyForm } from "@/components/account/company-form";
import { NotificationPrefs } from "@/components/account/notification-prefs";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import {
  DeactivateAccountCard,
  TwoFactorForm,
} from "@/components/account/security-forms";
import {
  CategoriesForm,
  GeoScopesForm,
} from "@/components/account/business-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const USER_TYPE_LABELS: Record<number, string> = { 1: "Supplier", 2: "Buyer" };

export default async function AccountPage() {
  const [t, locale, session] = await Promise.all([
    getT(),
    getLocale(),
    auth(),
  ]);
  const userId = Number(session!.user.id);
  const companyId = session!.user.companyId;
  // Las direcciones de entrega solo aplican a compradores: se usan en sus
  // requisiciones (feedback presentación 2026-09-26, lámina 1).
  const isSupplier = session!.user.userTypeId === 1;

  const [
    user,
    business,
    addresses,
    company,
    companyUsers,
    companySuperadmin,
    subscription,
  ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          lastName: true,
          email: true,
          avatar: true,
          phoneCountryCode: true,
          phone: true,
          celPhoneCountryCode: true,
          celPhone: true,
          twoFactorAuthenticationEnabled: true,
        },
      }),
      getBusinessProfile(userId),
      getDeliveryAddresses(userId),
      getCompanyDetails(companyId),
      getCompanyUsers(companyId, userId),
      getCompanySuperadmin(companyId),
      getSubscriptionInfo(userId),
    ]);
  if (!user) notFound();

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const approvedTotal = subscription.payments
    .filter((p) => p.status.toLowerCase() === "approved")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">{t("Account Settings")}</h1>
      <Tabs defaultValue="profile">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="profile">{t("Profile")}</TabsTrigger>
          {company && <TabsTrigger value="company">{t("Company")}</TabsTrigger>}
          <TabsTrigger value="business">
            {t("Geographic zone and business line")}
          </TabsTrigger>
          <TabsTrigger value="security">{t("Security")}</TabsTrigger>
          {company && <TabsTrigger value="users">{t("Users")}</TabsTrigger>}
          <TabsTrigger value="subscription">{t("Subscription")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-5">
          <AvatarForm
            fullName={`${user.name} ${user.lastName}`.trim()}
            avatar={user.avatar}
          />
          <ProfileForm
            name={user.name}
            lastName={user.lastName}
            email={user.email}
            phoneCountryCode={user.phoneCountryCode}
            phone={user.phone}
          />
          {!isSupplier && (
            <AddressesCard
              addresses={addresses}
              countries={business.countries}
              states={business.states}
            />
          )}
        </TabsContent>

        {company && (
          <TabsContent value="company" className="mt-4 space-y-5">
            <CompanyForm
              company={company}
              countries={business.countries}
              states={business.states}
            />
          </TabsContent>
        )}

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

        <TabsContent value="security" className="mt-4 space-y-5">
          <PasswordForm />
          <TwoFactorForm
            enabled={user.twoFactorAuthenticationEnabled}
            celPhoneCountryCode={user.celPhoneCountryCode}
            celPhone={user.celPhone}
          />
          <DeactivateAccountCard />
        </TabsContent>

        {company && (
          <TabsContent value="users" className="mt-4 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>{t("Users in your company")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Cada usuario sabe quién es su superadmin (feedback
                    presentación 2026-09-26, lámina 3). */}
                {companySuperadmin && (
                  <p className="text-sm text-muted-foreground">
                    {t("Your company's superadmin")}:{" "}
                    <span className="font-medium text-foreground">
                      {companySuperadmin.id === userId
                        ? t("You")
                        : companySuperadmin.fullName}
                    </span>{" "}
                    ({companySuperadmin.email})
                  </p>
                )}
                {companyUsers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t("There are no other users in your company yet.")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Name")}</TableHead>
                        <TableHead>{t("User type")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                        <TableHead>{t("Joined day")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {u.avatar && (
                                  <AvatarImage src={u.avatar} alt={u.fullName} />
                                )}
                                <AvatarFallback>
                                  {u.fullName
                                    .split(" ")
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{u.fullName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.userTypeId ? (
                              <Badge variant="secondary">
                                {t(USER_TYPE_LABELS[u.userTypeId] ?? String(u.userTypeId))}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                u.accountStatus === "active"
                                  ? "bg-[#dfffea] text-[#569842]"
                                  : "bg-[#ffeef3] text-[#f8285a]"
                              }
                            >
                              {t(u.accountStatus === "active" ? "Active" : "Deactivated")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.createdAt
                              ? dateFmt.format(new Date(u.createdAt))
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="subscription" className="mt-4 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t("My subscription")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {subscription.subscription ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Badge className="bg-[#dfffea] text-[#569842]">
                    {subscription.subscription.planTitle}
                  </Badge>
                  <span className="text-muted-foreground">
                    {t("Status")}: {t(subscription.subscription.status)}
                  </span>
                  <span className="text-muted-foreground">
                    {t("Since")}{" "}
                    {dateFmt.format(
                      new Date(subscription.subscription.startDate),
                    )}
                    {subscription.subscription.endDate &&
                      ` · ${t("Until")} ${dateFmt.format(new Date(subscription.subscription.endDate))}`}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("You have no active subscription. You are using the free Basic plan.")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Billing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-4 text-sm">
              {company ? (
                <>
                  <p>
                    <span className="text-muted-foreground">{t("Business name")}: </span>
                    {company.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">RFC: </span>
                    {company.rfcTaxId}
                  </p>
                  <p className="pt-2 text-xs text-muted-foreground">
                    {t("Invoices are issued with your company's fiscal data. Update them in the Company tab.")}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {t("Your user has no company assigned, so it cannot publish posts.")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Payments and account statement")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("Registered payments")}</p>
                  <p className="text-lg font-semibold">
                    {subscription.payments.length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("Total approved")}</p>
                  <p className="text-lg font-semibold">
                    $
                    {approvedTotal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              {subscription.payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("You have no registered payments yet.")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Date")}</TableHead>
                      <TableHead>{t("Method")}</TableHead>
                      <TableHead>{t("Reference")}</TableHead>
                      <TableHead>{t("Status")}</TableHead>
                      <TableHead className="text-right">{t("Amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscription.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {p.createdAt
                            ? dateFmt.format(new Date(p.createdAt))
                            : "—"}
                        </TableCell>
                        <TableCell>{t(p.method)}</TableCell>
                        <TableCell>{p.reference || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t(p.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${p.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <NotificationPrefs
            channels={subscription.channels}
            categories={subscription.categories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
