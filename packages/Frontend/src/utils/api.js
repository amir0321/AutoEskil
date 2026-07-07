const API_BASE = import.meta.env.PROD
  ? ""
  : (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );

export const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

export const adminUrl = (path = "") => apiUrl(`/api/admin${path}`);

export function apiFetch(path, options = {}) {
  const { headers = {}, ...rest } = options;
  return fetch(apiUrl(path), {
    credentials: "include",
    ...rest,
    headers,
  });
}

export function adminFetch(path = "", options = {}) {
  return apiFetch(`/api/admin${path}`, options);
}

let sessionCache = null;
let sessionCacheTime = 0;
let sessionCachePromise = null;
const SESSION_CACHE_TTL_MS = 5000;

export function invalidateAdminSessionCache() {
  sessionCache = null;
  sessionCacheTime = 0;
  sessionCachePromise = null;
}

export async function hasAdminSession() {
  const now = Date.now();

  if (sessionCache !== null && now - sessionCacheTime < SESSION_CACHE_TTL_MS) {
    return sessionCache;
  }

  if (sessionCachePromise) {
    return sessionCachePromise;
  }

  sessionCachePromise = (async () => {
    try {
      const response = await apiFetch("/api/session");
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.authenticated === true && data.user?.role === "admin";
    } catch (error) {
      // Session check failed - user is not authenticated, this is expected
      return false;
    } finally {
      sessionCachePromise = null;
    }
  })();

  const authenticated = await sessionCachePromise;
  sessionCache = authenticated;
  sessionCacheTime = Date.now();
  return authenticated;
}

export { API_BASE };
