import { request } from "./client";

export const getRegisterChecksApi = (entity, fy) =>
  request(`/register-checks?entity=${encodeURIComponent(entity)}&fy=${encodeURIComponent(fy)}`);

export const toggleRegisterCheckApi = (entity, fy, index) =>
  request("/register-checks/toggle", { method: "PUT", body: { entity, fy, index } });
