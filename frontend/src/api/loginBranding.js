import { request } from "./client";

// Login-page title + department. GET is public (used by the login screen);
// PUT is admin-only (Settings › Login Page).
export const getLoginBrandingApi = () => request("/login-branding");
export const updateLoginBrandingApi = (payload) => request("/login-branding", { method: "PUT", body: payload });
