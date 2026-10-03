const express = require("express");
const c = require("../controllers/moduleStore.controller");
const { protect } = require("../middleware/auth");

// Storage for the TruFin Accounts (Balance Sheet) and TruFin Secretarial modules:
// JSON documents grouped by collection, plus uploaded files in GridFS.
const router = express.Router();

router.use(protect);

router.get("/:app", c.getStore);
router.post("/:app/import", c.importStore);
router.put("/:app/doc/:col/:id", c.setDoc);
router.patch("/:app/doc/:col/:id", c.updateDoc);
router.delete("/:app/doc/:col/:id", c.deleteDoc);
router.post("/:app/files/:key", express.raw({ type: () => true, limit: "60mb" }), c.putFile);
router.get("/:app/files/:key", c.getFile);
router.delete("/:app/files/:key", c.deleteFile);

module.exports = router;
