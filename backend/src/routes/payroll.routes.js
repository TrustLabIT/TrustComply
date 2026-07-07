const express = require("express");
const { syncPayroll } = require("../controllers/payroll.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Requires a TrustComply login; the PACE key stays server-side.
router.get("/", protect, syncPayroll);

module.exports = router;
