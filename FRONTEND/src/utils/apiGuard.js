/**
 * apiGuard.js — Throws early if VITE_API_URL is missing.
 * Import this at the top of any component making API calls.
 */
export function getApiUrl() {
  const url = import.meta.env.VITE_API_URL;
  if (!url || url === 'undefined') {
    throw new Error(
      '[apiGuard] VITE_API_URL is not set. ' +
      'Create frontend/.env.local with VITE_API_URL=http://localhost:4000'
    );
  }
  return url;
}
