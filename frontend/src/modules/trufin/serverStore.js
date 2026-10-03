// Server-backed storage for the TruFin modules. Exposes the same small interface
// the reference pages used for their browser store — doc(path).get/set/update/
// delete, collection(name).onSnapshot, exportAll/importAll — so the ported page
// logic runs unchanged, but every write lands in /api/module-store/<app>.

import { API_BASE_URL } from "../../config";
import { request, getToken } from "../../api/client";

const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
function deepMerge(t, s) {
  for (const k in s) {
    if (isObj(s[k]) && isObj(t[k])) deepMerge(t[k], s[k]);
    else t[k] = clone(s[k]);
  }
  return t;
}

// Errors the page already understands: a 403 becomes code "invalid_argument",
// which both pages treat as "you can view but not change".
async function call(path, opts) {
  try {
    return await request(path, opts);
  } catch (e) {
    if (/not change|403|Admins only|No access/i.test(e.message || "")) e.code = "invalid_argument";
    throw e;
  }
}

export async function openServerDB(app, cols, seed) {
  const enc = encodeURIComponent;
  const { store: remote } = await call(`/module-store/${app}`);
  let store = isObj(remote) ? remote : {};
  for (const c of cols) store[c] = isObj(store[c]) ? store[c] : {};

  // First use of an empty module: write the starter records (if any).
  if (seed && cols.every((c) => !Object.keys(store[c]).length)) {
    const s = seed();
    for (const c in s)
      for (const id in s[c]) {
        store[c] = store[c] || {};
        store[c][id] = clone(s[c][id]);
        try {
          await call(`/module-store/${app}/doc/${enc(c)}/${enc(id)}`, { method: "PUT", body: { data: s[c][id] } });
        } catch (_) {
          /* viewer accounts can't seed; the record still shows locally */
        }
      }
  }

  const subs = {};
  const snap = (c) => {
    store[c] = store[c] || {};
    const docs = Object.keys(store[c]).sort().map((id) => ({ id, exists: true, data: () => clone(store[c][id]) }));
    return { docs, size: docs.length, empty: !docs.length };
  };
  const emit = (c) => (subs[c] || []).forEach((f) => f(snap(c)));
  const url = (c, id) => `/module-store/${app}/doc/${enc(c)}/${enc(id)}`;

  return {
    exportAll: () => clone(store),
    importAll: async (s) => {
      const next = {};
      for (const c of cols) next[c] = isObj(s[c]) ? clone(s[c]) : {};
      store = next;
      for (const c of Object.keys(store)) emit(c);
      await call(`/module-store/${app}/import`, { method: "POST", body: { store: next } });
    },
    doc(p) {
      const [c, id] = p.split("/");
      store[c] = store[c] || {};
      return {
        get: async () => ({ id, exists: !!store[c][id], data: () => clone(store[c][id]) }),
        set: async (d) => {
          store[c][id] = clone(d);
          emit(c);
          await call(url(c, id), { method: "PUT", body: { data: d } });
        },
        update: async (d) => {
          store[c][id] = deepMerge(store[c][id] || {}, d);
          emit(c);
          await call(url(c, id), { method: "PATCH", body: { data: d } });
        },
        delete: async () => {
          delete store[c][id];
          emit(c);
          await call(url(c, id), { method: "DELETE" });
        },
      };
    },
    collection(c) {
      return {
        onSnapshot(f) {
          (subs[c] = subs[c] || []).push(f);
          setTimeout(() => f(snap(c)), 0);
          return () => {
            subs[c] = (subs[c] || []).filter((x) => x !== f);
          };
        },
      };
    },
  };
}

// Uploaded files, keyed by the id the page generates. Same shape the page used
// for IndexedDB: put(key, {blob, name, type}), get(key) → {blob, name, type}.
export function serverFiles(app) {
  const u = (k) => `${API_BASE_URL}/module-store/${app}/files/${encodeURIComponent(k)}`;
  const auth = () => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };
  const fail = async (r) => {
    let msg = `Request failed (${r.status})`;
    try {
      const j = await r.json();
      if (j && j.message) msg = j.message;
    } catch (_) {
      /* not JSON */
    }
    const e = new Error(msg);
    if (r.status === 413) e.code = "too_large";
    if (r.status === 403) e.code = "invalid_argument";
    throw e;
  };
  return {
    async put(key, rec) {
      const r = await fetch(u(key), {
        method: "POST",
        headers: {
          ...auth(),
          "Content-Type": "application/octet-stream",
          "X-File-Name": encodeURIComponent(rec.name || key),
          "X-File-Type": rec.type || "application/octet-stream",
        },
        body: rec.blob,
      });
      if (!r.ok) await fail(r);
    },
    async get(key) {
      const r = await fetch(u(key), { headers: auth() });
      if (r.status === 404) return undefined;
      if (!r.ok) await fail(r);
      const type = r.headers.get("Content-Type") || "application/octet-stream";
      let name = key;
      try {
        name = decodeURIComponent(r.headers.get("X-File-Name") || key);
      } catch (_) {
        /* keep key */
      }
      const raw = await r.blob();
      return { blob: new Blob([raw], { type }), name, type };
    },
    async del(key) {
      const r = await fetch(u(key), { method: "DELETE", headers: auth() });
      if (!r.ok && r.status !== 404) await fail(r);
    },
  };
}
