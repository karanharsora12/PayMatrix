export const ApiConfig = {
  BASE_URL: import.meta.env.VITE_API_URL as string,
} as const;

export const env = {
  VITE_API_URL: import.meta.env.VITE_API_URL as string,
  BASE_URL: import.meta.env.VITE_API_URL,
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
