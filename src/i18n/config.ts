export const locales = ["es", "en", "de", "fr", "ja", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";
export const LOCALE_COOKIE = "efness-locale";
