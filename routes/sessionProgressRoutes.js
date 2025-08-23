// routes/sessionProgressRoutes.js

const express = require("express");
const router = express.Router();
const sessionProgressController = require("../controllers/sessionProgressController");

router.post("/save", sessionProgressController.saveProgress);
router.get("/fetch", sessionProgressController.getProgress);
router.post("/complete", sessionProgressController.completeProgress);

module.exports = router;
