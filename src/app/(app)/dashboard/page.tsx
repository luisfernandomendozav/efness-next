import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";

export default async function DashboardPage() {
  const [t, session] = await Promise.all([getT(), auth()]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("Dashboard")}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {session?.user.name} — {session?.user.email}
      </p>
    </div>
  );
}
