const express = require("express");
const router = express.Router();
const { submitDemographics } = require("../controllers/demographicsController");

console.log("📂 demographicsRoutes.js loaded");

router.post("/", (req, res, next) => {
  console.log("📥 /api/demographics POST hit");
  next();
}, submitDemographics);

module.exports = router;
