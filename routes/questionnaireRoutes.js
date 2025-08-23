const express = require("express");
const router = express.Router();
const { 
  startQuestionnaire, 
  submitQuestionnaire 
} = require("../controllers/questionnaireController");

router.post("/start", startQuestionnaire);
router.post("/submit", submitQuestionnaire);

module.exports = router;