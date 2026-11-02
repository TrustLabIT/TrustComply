const express = require("express");
const { getLoginBranding, updateLoginBranding } = require("../controllers/loginBranding.controller");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Read is public (the login page renders before sign-in); changing it is
// admin-only, the same rule as Settings / user management.
router.get("/", getLoginBranding);
router.put("/", protect, adminOnly, updateLoginBranding);

module.exports = router;
