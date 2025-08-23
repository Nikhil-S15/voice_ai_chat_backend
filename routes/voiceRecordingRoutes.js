const express = require("express");
const router = express.Router();
const multer = require('multer');
const { submitRecording, getInstructions } = require("../controllers/voiceController");

const upload = multer();

router.post("/", upload.single('audio'), submitRecording);
router.get("/instructions/:language", getInstructions);

module.exports = router;