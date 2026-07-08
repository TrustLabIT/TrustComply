const express = require("express");
const { licenceSummary, licenceList } = require("../controllers/medical.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Requires a TrustComply login; the TAMS key stays server-side.
router.use(protect);

router.get("/licence/summary", licenceSummary);
router.get("/licence/list", licenceList);

module.exports = router;
