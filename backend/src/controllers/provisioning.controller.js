// PACE identity-hub provisioning for TrustComply (Express + Mongoose).
// Creates / links / enables / disables a login. Identity = lowercased email;
// a shared matchUuid (from PACE) is stored so the same person is always found.
// Disable = status "disabled" (the login + protect middleware already honor it).
// Password: the User pre('save') hook hashes a plaintext (PACE sends it at
// create); a pre-made bcrypt hash is written directly to bypass double-hashing.
const User = require("../models/User");
const { setToken } = require("../middleware/provisioning");

const ping = (req, res) => res.json({ ok: true, app: "comply" });

const rotateToken = (req, res, next) => {
  try {
    const nt = String((req.body && req.body.new_token) || "").trim();
    if (!nt) {
      res.status(422);
      throw new Error("new_token required");
    }
    setToken(nt);
    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
};

async function findUser(email, uuid) {
  if (uuid) {
    const u = await User.findOne({ matchUuid: uuid }).select("+password");
    if (u) return u;
  }
  if (email) {
    return User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  }
  return null;
}

const lookup = async (req, res, next) => {
  try {
    const u = await findUser(req.query.email, req.query.uuid);
    if (!u) return res.json({ found: false });
    return res.json({
      found: true,
      external_id: u._id,
      match_uuid: u.matchUuid || null,
      active: u.status === "active",
      email: u.email,
      name: u.name,
    });
  } catch (err) {
    return next(err);
  }
};

const store = async (req, res, next) => {
  try {
    const b = req.body || {};
    const matchUuid = String(b.match_uuid || "").trim();
    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const passwordHash = String(b.password_hash || "");
    const wantActive = b.active === undefined ? true : !!b.active;

    if (!matchUuid || !name || !email || !passwordHash) {
      res.status(422);
      throw new Error("match_uuid, name, email, password_hash required");
    }

    const existing = await findUser(email, matchUuid);
    if (existing) {
      if (!existing.matchUuid) {
        existing.matchUuid = matchUuid;
        await existing.save();
      }
      return res.json({ status: "linked", external_id: existing._id, match_uuid: matchUuid });
    }

    const u = new User({
      name,
      email,
      matchUuid,
      role: "view", // least privilege
      status: wantActive ? "active" : "disabled",
      // plaintext is hashed by the pre('save') hook; placeholder when only a hash
      // is available (overwritten below, bypassing the hook to avoid double-hash).
      password: password || "pace_placeholder",
    });
    if (b.designation) u.desig = String(b.designation);
    if (b.phone) u.mobile = String(b.phone);
    await u.save();

    if (!password) {
      // Store PACE's precomputed bcrypt hash directly (bypasses the hashing hook).
      await User.updateOne({ _id: u._id }, { $set: { password: passwordHash } });
    }

    return res.json({ status: "created", external_id: u._id, match_uuid: matchUuid });
  } catch (err) {
    return next(err);
  }
};

const setActive = (value) => async (req, res, next) => {
  try {
    const u = await findUser(req.body && req.body.email, req.body && req.body.match_uuid);
    if (!u) return res.json({ status: "not_found" });
    u.status = value ? "active" : "disabled";
    await u.save(); // password not modified → hook is a no-op
    return res.json({ status: value ? "enabled" : "disabled", external_id: u._id });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  ping,
  rotateToken,
  lookup,
  store,
  enable: setActive(true),
  disable: setActive(false),
};
