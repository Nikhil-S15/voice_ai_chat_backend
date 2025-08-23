// routes/pharynxRoutes.js
const express = require("express");
const router = express.Router();
const { submitPharynxCancer } = require("../controllers/pharynxControlle");

// ✅ POST endpoint for Flutter
router.post("/", submitPharynxCancer);

module.exports = router;
