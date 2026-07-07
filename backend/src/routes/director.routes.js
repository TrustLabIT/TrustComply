const express = require("express");
const {
  listDirectors,
  createDirector,
  updateDirector,
  deleteDirector,
} = require("../controllers/director.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Any signed-in user may read; the UI gates who can add/edit (CS editors + admin).
router.use(protect);

router.route("/").get(listDirectors).post(createDirector);
router.route("/:id").put(updateDirector).delete(deleteDirector);

module.exports = router;
