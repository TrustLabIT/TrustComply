const express = require("express");
const { listEmpFilings, upsertEmpFiling } = require("../controllers/empFiling.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", listEmpFilings);
router.put("/", upsertEmpFiling);

module.exports = router;
