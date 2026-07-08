import { request } from "./client";

// Filing-status overlay (status / reference / documents) for EPFO / ESI / PT.
// Amounts are NOT here — they come from PACE.
export const listEmpFilingsApi = (fy, sub) =>
  request(`/emp-filings?fy=${encodeURIComponent(fy)}&sub=${encodeURIComponent(sub)}`);

export const upsertEmpFilingApi = (payload) =>
  request("/emp-filings", { method: "PUT", body: payload });
