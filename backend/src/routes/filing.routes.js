const express = require("express");
const {
  listFilings,
  createFiling,
  updateFiling,
  deleteFiling,
} = require("../controllers/filing.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All filing routes require a valid login.
router.use(protect);

router.route("/").get(listFilings).post(createFiling);
router.route("/:id").put(updateFiling).delete(deleteFiling);

module.exports = router;
