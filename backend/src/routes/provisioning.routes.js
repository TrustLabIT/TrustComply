// PACE identity-hub provisioning routes. Guarded by the X-Provisioning-Token
// shared secret (not JWT); server-to-server, no session. Mounted at
// /api/provisioning in app.js → /api/provisioning/*.
const express = require("express");
const { provisioningGuard } = require("../middleware/provisioning");
const ctrl = require("../controllers/provisioning.controller");

const router = express.Router();

router.use(provisioningGuard); // every route below requires the token

router.get("/ping", ctrl.ping);
router.post("/rotate-token", ctrl.rotateToken);
router.get("/users/lookup", ctrl.lookup);
router.post("/users", ctrl.store);
router.post("/users/enable", ctrl.enable);
router.post("/users/disable", ctrl.disable);

module.exports = router;
