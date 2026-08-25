// Las claves legacy son frases en inglés que contienen ".", pero next-intl
// reserva "." para anidación. Codificamos el punto como "․" (one dot
// leader) en ambos lados: al cargar los catálogos y al resolver claves.
export function encodeKey(key: string) {
  return key.replaceAll(".", "․");
}

export function encodeMessages(messages: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(messages).map(([k, v]) => [encodeKey(k), v]),
  );
}
