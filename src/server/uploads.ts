import { put } from "@vercel/blob";

// Archivos (avatares, logos, imágenes y fichas técnicas de producto) van a
// Vercel Blob (store "efness-files", acceso público con URL no adivinable).
// El legacy los guardaba en el disco del droplet vía Storage de Laravel.

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB, como el legacy
export const PDF_MAX_BYTES = 10 * 1024 * 1024; // 10 MB, como el legacy

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type UploadResult =
  | { url: string }
  | { error: "file_too_large" | "invalid_file_type" | "upload_failed" };

async function upload(file: File, folder: string): Promise<UploadResult> {
  try {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const blob = await put(`${folder}/${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  } catch {
    return { error: "upload_failed" };
  }
}

export async function uploadImage(
  file: File,
  folder: string,
): Promise<UploadResult> {
  if (!IMAGE_TYPES.includes(file.type)) return { error: "invalid_file_type" };
  if (file.size > IMAGE_MAX_BYTES) return { error: "file_too_large" };
  return upload(file, folder);
}

export async function uploadPdf(
  file: File,
  folder: string,
): Promise<UploadResult> {
  if (file.type !== "application/pdf") return { error: "invalid_file_type" };
  if (file.size > PDF_MAX_BYTES) return { error: "file_too_large" };
  return upload(file, folder);
}
