const mongoose = require("mongoose");
const ModuleDoc = require("../models/ModuleDoc");

// Which roles may read / write each module. Mirrors ROLE_DEF on the frontend:
// Accounts (Balance Sheet) belongs to the CA desk, Secretarial to the CS desk.
const APPS = {
  accounts: { read: ["admin", "ca", "view"], write: ["admin", "ca"] },
  secretarial: { read: ["admin", "cs", "view"], write: ["admin", "cs"] },
};
const MAX_FILE = 50 * 1048576;

const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
// Same semantics as the client's deepMerge: nested objects merge, everything else
// (including null and arrays) replaces.
function deepMerge(t, s) {
  for (const k in s) {
    if (isObj(s[k]) && isObj(t[k])) deepMerge(t[k], s[k]);
    else t[k] = clone(s[k]);
  }
  return t;
}

function guard(req, res, mode) {
  const def = APPS[req.params.app];
  if (!def) {
    res.status(404);
    throw new Error("Unknown module");
  }
  if (!def[mode].includes(req.user.role)) {
    res.status(403);
    throw new Error(mode === "write" ? "You can view this module but not change it." : "No access to this module");
  }
}
const parse = (s) => {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
};
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "modulefiles" });

// GET /api/module-store/:app  → { store: { [col]: { [id]: data } } }
const getStore = async (req, res, next) => {
  try {
    guard(req, res, "read");
    const docs = await ModuleDoc.find({ app: req.params.app }).lean();
    const store = {};
    for (const d of docs) (store[d.col] = store[d.col] || {})[d.docId] = parse(d.json);
    res.json({ store });
  } catch (err) {
    next(err);
  }
};

// PUT /api/module-store/:app/doc/:col/:id   body: { data }  (replace)
const setDoc = async (req, res, next) => {
  try {
    guard(req, res, "write");
    const { app, col, id } = req.params;
    const data = isObj(req.body.data) ? req.body.data : {};
    await ModuleDoc.updateOne(
      { app, col, docId: id },
      { $set: { json: JSON.stringify(data), updatedBy: String(req.user._id) } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/module-store/:app/doc/:col/:id   body: { data }  (deep merge)
const updateDoc = async (req, res, next) => {
  try {
    guard(req, res, "write");
    const { app, col, id } = req.params;
    const cur = await ModuleDoc.findOne({ app, col, docId: id });
    const merged = deepMerge(cur ? parse(cur.json) : {}, isObj(req.body.data) ? req.body.data : {});
    await ModuleDoc.updateOne(
      { app, col, docId: id },
      { $set: { json: JSON.stringify(merged), updatedBy: String(req.user._id) } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/module-store/:app/doc/:col/:id
const deleteDoc = async (req, res, next) => {
  try {
    guard(req, res, "write");
    const { app, col, id } = req.params;
    await ModuleDoc.deleteOne({ app, col, docId: id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/module-store/:app/import   body: { store }
// Replaces every document of the module (Restore from a backup file).
const importStore = async (req, res, next) => {
  try {
    guard(req, res, "write");
    const { app } = req.params;
    const store = isObj(req.body.store) ? req.body.store : {};
    const rows = [];
    for (const col in store) {
      if (!isObj(store[col])) continue;
      for (const id in store[col]) {
        rows.push({ app, col, docId: id, json: JSON.stringify(store[col][id] || {}), updatedBy: String(req.user._id) });
      }
    }
    await ModuleDoc.deleteMany({ app });
    if (rows.length) await ModuleDoc.insertMany(rows);
    res.json({ ok: true, count: rows.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/module-store/:app/files/:key   raw body; headers x-file-name, x-file-type
const putFile = async (req, res, next) => {
  try {
    guard(req, res, "write");
    const { app, key } = req.params;
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || !buf.length) {
      res.status(400);
      throw new Error("Empty file");
    }
    if (buf.length > MAX_FILE) {
      res.status(413);
      throw new Error("The file is too large.");
    }
    let name = key;
    try {
      name = decodeURIComponent(req.headers["x-file-name"] || key);
    } catch {
      /* keep key */
    }
    const type = req.headers["x-file-type"] || "application/octet-stream";
    const b = bucket();
    const old = await b.find({ "metadata.app": app, "metadata.key": key }).toArray();
    for (const f of old) await b.delete(f._id);
    await new Promise((resolve, reject) => {
      const up = b.openUploadStream(name, { metadata: { app, key, name, type, by: String(req.user._id) } });
      up.on("finish", resolve);
      up.on("error", reject);
      up.end(buf);
    });
    res.json({ ok: true, id: key });
  } catch (err) {
    next(err);
  }
};

// GET /api/module-store/:app/files/:key  → the file bytes
const getFile = async (req, res, next) => {
  try {
    guard(req, res, "read");
    const { app, key } = req.params;
    const b = bucket();
    const [f] = await b.find({ "metadata.app": app, "metadata.key": key }).sort({ uploadDate: -1 }).limit(1).toArray();
    if (!f) {
      res.status(404);
      throw new Error("File not found");
    }
    const meta = f.metadata || {};
    res.set("Content-Type", meta.type || "application/octet-stream");
    res.set("X-File-Name", encodeURIComponent(meta.name || f.filename));
    res.set("Access-Control-Expose-Headers", "X-File-Name, Content-Type");
    b.openDownloadStream(f._id).on("error", next).pipe(res);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/module-store/:app/files/:key
const deleteFile = async (req, res, next) => {
  try {
    guard(req, res, "write");
    const { app, key } = req.params;
    const b = bucket();
    const files = await b.find({ "metadata.app": app, "metadata.key": key }).toArray();
    for (const f of files) await b.delete(f._id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStore, setDoc, updateDoc, deleteDoc, importStore, putFile, getFile, deleteFile };
