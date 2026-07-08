import { request } from "./client";

// Per-branch compliance config (ESI sub-code, PT registration, state, due-day).
export const listBranchConfigsApi = () => request("/branch-configs");
export const upsertBranchConfigApi = (payload) => request("/branch-configs", { method: "PUT", body: payload });
