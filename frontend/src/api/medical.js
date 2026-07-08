import { request } from "./client";

const qs = (params = {}) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return s ? `?${s}` : "";
};

// Both proxy through the TrustComply backend (which adds the TAMS X-API-Key).
export const getLicenceSummaryApi = (location) => request(`/medical/licence/summary${qs({ location })}`);
export const getLicenceListApi = (params = {}) => request(`/medical/licence/list${qs(params)}`);
