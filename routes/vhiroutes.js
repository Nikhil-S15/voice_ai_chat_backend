const express = require("express");
const router = express.Router();
const { submitVHI, getVHIHistory } = require("../controllers/vhiController");

// Submit new VHI assessment
router.post("/", submitVHI);

// Get user's VHI history
router.get("/history/:userId", getVHIHistory);

module.exports = router;