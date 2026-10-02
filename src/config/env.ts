export const ApiConfig = {
  BASE_URL: (import.meta.env.VITE_API_URL as string) || "http://localhost:3001/api/v1",
} as const;

/**
 * Resolves an image path or URL against the base URL from env
 */
export function getImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("data:")
  ) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${ApiConfig.BASE_URL}${cleanPath}`;
}
