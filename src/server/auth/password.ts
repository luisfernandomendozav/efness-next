import bcrypt from "bcryptjs";

// Laravel genera hashes con prefijo $2y$; bcryptjs espera $2a$/$2b$.
// El algoritmo es idéntico, solo cambia el identificador de versión.
export async function verifyPassword(plain: string, hash: string) {
  const normalized = hash.replace(/^\$2y\$/, "$2b$");
  return bcrypt.compare(plain, normalized);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}
