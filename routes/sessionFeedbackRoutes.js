const express = require("express");
const router = express.Router();
const { submitSessionFeedback } = require("../controllers/sessionFeedbackController");

router.post("/", submitSessionFeedback);

module.exports = router;