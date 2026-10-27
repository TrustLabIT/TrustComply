// PACE identity-hub provisioning auth: a shared secret on the X-Provisioning-Token
// header. The active token lives in a file (rotatable from PACE) with a
// PROVISIONING_TOKEN env fallback. Constant-time compare; 503 when not
// configured, 401 when missing/wrong.
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

// backend/provisioning_token (src/middleware -> up two)
const TOKEN_FILE = path.join(__dirname, "..", "..", "provisioning_token");

function currentToken() {
  try {
    const t = fs.readFileSync(TOKEN_FILE, "utf8").trim();
    if (t) return t;
  } catch (e) {
    /* no file yet */
  }
  return (process.env.PROVISIONING_TOKEN || "").trim();
}

function setToken(newToken) {
  fs.writeFileSync(TOKEN_FILE, String(newToken || "").trim());
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function provisioningGuard(req, res, next) {
  const expected = currentToken();
  if (!expected) {
    res.status(503);
    return next(new Error("Provisioning not configured."));
  }
  const given = req.headers["x-provisioning-token"] || "";
  if (!safeEqual(given, expected)) {
    res.status(401);
    return next(new Error("Invalid provisioning token."));
  }
  return next();
}

module.exports = { provisioningGuard, currentToken, setToken };
