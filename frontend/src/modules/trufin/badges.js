// Tiny shared store for sidebar badges raised by the TruFin modules (e.g. the
// Secretarial calendar's overdue count, shown next to "Calendar" in the sidebar).
import { useSyncExternalStore } from "react";

const KEY = "trufin.badges";
let state = {};
try {
  state = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
} catch (_) {
  state = {};
}
const subs = new Set();

export function setBadge(id, n) {
  if (state[id] === n) return;
  state = { ...state, [id]: n };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {
    /* storage blocked */
  }
  subs.forEach((f) => f());
}

export function useBadge(id) {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state[id] || 0
  );
}
