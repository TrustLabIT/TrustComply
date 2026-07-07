import { request } from "./client";

export const listUsersApi = () => request("/users");

// Server-side paginated + filtered list → { items, total, page, limit, pages, stats }.
export const getUsersPageApi = (params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return request(`/users${qs ? `?${qs}` : ""}`);
};
export const createUserApi = (payload) => request("/users", { method: "POST", body: payload });
export const updateUserApi = (id, patch) => request(`/users/${id}`, { method: "PUT", body: patch });
export const deleteUserApi = (id) => request(`/users/${id}`, { method: "DELETE" });
