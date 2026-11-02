const Setting = require("../models/Setting");

// Login-page branding — the title and department shown under the logo on the
// sign-in screen. Stored as two key-value Settings (login_title,
// login_department); missing keys or a read error fall back to the defaults.
const TITLE_KEY = "login_title";
const DEPT_KEY = "login_department";
const DEFAULTS = { title: "TRUSTCOMPLY", department: "" };
const TITLE_MAX = 40;
const DEPT_MAX = 60;

const clean = (s) => String(s).replace(/\s+/g, " ").trim();

async function read() {
  try {
    const rows = await Setting.find({ key: { $in: [TITLE_KEY, DEPT_KEY] } }).lean();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const title = typeof map[TITLE_KEY] === "string" && clean(map[TITLE_KEY]) ? map[TITLE_KEY] : DEFAULTS.title;
    const department = typeof map[DEPT_KEY] === "string" ? map[DEPT_KEY] : DEFAULTS.department;
    return { title, department };
  } catch {
    return { ...DEFAULTS };
  }
}

// GET /api/login-branding  (public — the login page calls it before sign-in)
const getLoginBranding = async (req, res) => {
  res.json(await read());
};

// PUT /api/login-branding   body: { title, department? }   (admin only)
const updateLoginBranding = async (req, res, next) => {
  try {
    const { title, department } = req.body || {};
    if (typeof title !== "string" || (department != null && typeof department !== "string")) {
      res.status(400);
      throw new Error("Title and department must be text");
    }
    const t = clean(title).toUpperCase();
    const d = clean(department || "");
    if (!t) {
      res.status(400);
      throw new Error("Login title is required");
    }
    if (t.length > TITLE_MAX) {
      res.status(400);
      throw new Error(`Login title must be ${TITLE_MAX} characters or fewer`);
    }
    if (d.length > DEPT_MAX) {
      res.status(400);
      throw new Error(`Department must be ${DEPT_MAX} characters or fewer`);
    }
    const by = String(req.user._id);
    await Setting.bulkWrite([
      { updateOne: { filter: { key: TITLE_KEY }, update: { $set: { value: t, updatedBy: by } }, upsert: true } },
      { updateOne: { filter: { key: DEPT_KEY }, update: { $set: { value: d, updatedBy: by } }, upsert: true } },
    ]);
    res.json({ title: t, department: d });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLoginBranding, updateLoginBranding };
