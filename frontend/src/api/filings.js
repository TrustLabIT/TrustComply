import { request } from "./client";

export const listFilingsApi = () => request("/filings");

// Server-side paginated + filtered + searched list. Returns { items, total, page, limit, pages }.
export const getFilingsPageApi = (params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return request(`/filings${qs ? `?${qs}` : ""}`);
};
export const createFilingApi = (payload) => request("/filings", { method: "POST", body: payload });
export const updateFilingApi = (id, patch) => request(`/filings/${id}`, { method: "PUT", body: patch });
export const deleteFilingApi = (id) => request(`/filings/${id}`, { method: "DELETE" });
