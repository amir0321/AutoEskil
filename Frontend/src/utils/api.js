const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

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

export async function hasAdminSession() {
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
  }
}

export { API_BASE };
