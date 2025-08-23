const express = require("express");
const router = express.Router();
const { submitGRBASRating, getGRBASRatings } = require("../controllers/grbasController");

// Submit GRBAS rating
router.post("/", submitGRBASRating);

// Get GRBAS ratings for a session
router.get("/:userId/:sessionId", getGRBASRatings);

module.exports = router;