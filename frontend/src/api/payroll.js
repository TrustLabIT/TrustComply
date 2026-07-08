import { request } from "./client";

// Pulls the FY-aligned payroll statutory figures that TrustComply's backend
// proxies from PACE (trust-people).
export const getPayrollSyncApi = (fy, groupBy) =>
  request(`/payroll-sync?fy=${encodeURIComponent(fy)}${groupBy ? `&group_by=${encodeURIComponent(groupBy)}` : ""}`);
