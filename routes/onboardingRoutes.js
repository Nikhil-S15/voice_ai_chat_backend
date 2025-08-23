const express = require("express");
const router = express.Router();
const { submitOnboarding } = require("../controllers/onboardingController");

router.post("/", submitOnboarding);

module.exports = router;
