const express = require("express");
const { listUsers, createUser, updateUser, deleteUser } = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// User management is admin-only.
router.use(protect, adminOnly);

router.route("/").get(listUsers).post(createUser);
router.route("/:id").put(updateUser).delete(deleteUser);

module.exports = router;
