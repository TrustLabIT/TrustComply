import { request } from "./client";

export const listDirectorsApi = () => request("/directors");

// Server-side searched + paginated list → { items, total, page, limit, pages }.
export const getDirectorsPageApi = (params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return request(`/directors${qs ? `?${qs}` : ""}`);
};
export const createDirectorApi = (payload) => request("/directors", { method: "POST", body: payload });
export const updateDirectorApi = (id, patch) => request(`/directors/${id}`, { method: "PUT", body: patch });
export const deleteDirectorApi = (id) => request(`/directors/${id}`, { method: "DELETE" });
