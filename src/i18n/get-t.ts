import { getTranslations } from "next-intl/server";
import { encodeKey } from "./encode";

// Equivalente de useT() para Server Components y acciones.
export async function getT() {
  const t = await getTranslations();
  const translate = t as unknown as (
    key: string,
    values?: Record<string, string | number | Date>,
  ) => string;
  return (key: string, values?: Record<string, string | number | Date>) =>
    translate(encodeKey(key), values);
}
