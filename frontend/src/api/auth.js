import { request } from "./client";

export const loginApi = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password } });

export const registerApi = (payload) =>
  request("/auth/register", { method: "POST", body: payload });

export const meApi = () => request("/auth/me");
