import { ROLE_DEF } from "./constants";
import { TODAY } from "./helpers";

// Role / permission helpers. All take the *current user* object explicitly so they
// stay pure and testable (no hidden global "current user").

export function roleOf(user) {
  return ROLE_DEF[user?.role] || ROLE_DEF.view;
}

export function isAdmin(user) {
  return roleOf(user).settings;
}

export function canSeeModule(user, m) {
  return roleOf(user).modules.includes(m);
}

export function canCreate(user) {
  return roleOf(user).edit;
}

export function canEditRec(user, r) {
  const rd = roleOf(user);
  return rd.edit && rd.modules.includes(r.module) && (user?.entities || []).includes(r.entity);
}

// Consultant engagement is "expiring" within 90 days of its validity date.
export function consultantExpiring(u) {
  if (u.kind !== "consultant" || !u.valid) return false;
  const d = Math.round((new Date(u.valid) - TODAY) / 86400000);
  return d <= 90;
}

// Is a nav id visible to this user?
export function navAllowed(user, id) {
  if (id === "settings") return isAdmin(user);
  if ((id || "").startsWith("cs-")) return canSeeModule(user, "CS");
  if ((id || "").startsWith("ca-") || (id || "").startsWith("emp-")) return canSeeModule(user, "CA");
  return true;
}
