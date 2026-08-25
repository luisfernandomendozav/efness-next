import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "./config";
import { encodeMessages } from "./encode";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requested = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(requested as Locale)
    ? (requested as Locale)
    : defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;
  // es.json es el único catálogo completo; los demás idiomas caen a español
  // para las claves que aún no traducen (mismo comportamiento que el legacy).
  const fallback =
    locale === defaultLocale
      ? {}
      : (await import(`../../messages/${defaultLocale}.json`)).default;

  return {
    locale,
    messages: encodeMessages({ ...fallback, ...messages }),
  };
});
