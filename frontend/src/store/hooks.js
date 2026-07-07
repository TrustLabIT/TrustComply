import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";

// The current user is now the authenticated (logged-in) account, not a Redux
// impersonation. Role-gating (navAllowed, canEditRec, isAdmin…) reads this.
export function useCurrentUser() {
  const { user } = useAuth();
  return user || { role: "view", entities: [], name: "", kind: "employee" };
}

// All filing rows scoped to the active entity + financial year.
export function useRows() {
  return useSelector((s) =>
    s.compliance.db.filter((r) => r.entity === s.compliance.entity && r.fy === s.compliance.fy)
  );
}

export function useScope() {
  return useSelector((s) => ({ entity: s.compliance.entity, fy: s.compliance.fy }));
}

export function useFilter() {
  return useSelector((s) => s.compliance.filter);
}
