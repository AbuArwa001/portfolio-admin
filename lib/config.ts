/**
 * Normalizes and returns the backend API URL.
 * Automatically adds the https:// protocol if omitted, strips trailing slashes,
 * and falls back safely to the production backend in production or localhost in development.
 */
export function getApiUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || !url.trim()) {
    return process.env.NODE_ENV === "production"
      ? "https://api.khalfanathman.dev"
      : "http://127.0.0.1:8000";
  }
  url = url.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  if (url.includes("localhost:8000")) {
    url = url.replace("localhost:8000", "127.0.0.1:8000");
  }
  return url.replace(/\/+$/, "");
}

export const API_BASE_URL = getApiUrl();
