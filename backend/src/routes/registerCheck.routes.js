const express = require("express");
const { getChecks, toggleCheck } = require("../controllers/registerCheck.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getChecks);
router.put("/toggle", toggleCheck);

module.exports = router;
