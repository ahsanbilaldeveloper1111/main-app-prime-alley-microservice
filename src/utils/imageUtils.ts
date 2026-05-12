import { backendUrl } from "./backendUrl";

/**
 * Resolve a backend-served image path to an absolute URL. The backend serves
 * uploads under `/api/storage/...`; this helper handles already-absolute
 * URLs, data URIs, and trims any duplicate leading slashes.
 *
 * @param imagePath - A path returned by the backend
 *   (e.g. `profiles/profile_2936.jpg`) or an absolute URL.
 * @returns A fully qualified image URL, or `null` when the input is empty.
 */
export const getStorageImageUrl = (
  imagePath: string | null | undefined,
): string | null => {
  if (!imagePath) return null;

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:") ||
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }

  const cleaned = imagePath.replace(/^\/+/, "");
  const storagePath = cleaned.startsWith("api/storage/")
    ? `/${cleaned}`
    : `/api/storage/${cleaned}`;

  return backendUrl(storagePath);
};
