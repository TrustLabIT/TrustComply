const express = require("express");
const { listBranchConfigs, upsertBranchConfig } = require("../controllers/branchConfig.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", listBranchConfigs);
router.put("/", upsertBranchConfig);

module.exports = router;
