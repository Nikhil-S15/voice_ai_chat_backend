const express = require("express");
const router = express.Router();
const { submitLarynxCancer } = require("../controllers/larynxControlle");

// 📌 POST route to save data
router.post("/", submitLarynxCancer);

module.exports = router;
