"use client";

import { useTranslations } from "next-intl";
import { encodeKey } from "./encode";

// Reemplazo directo de useTranslations() que acepta las claves legacy
// (frases con puntos). Usar siempre este hook en componentes cliente.
export function useT() {
  const t = useTranslations();
  const translate = t as unknown as (
    key: string,
    values?: Record<string, string | number | Date>,
  ) => string;
  return (key: string, values?: Record<string, string | number | Date>) =>
    translate(encodeKey(key), values);
}
