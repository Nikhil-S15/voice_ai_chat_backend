const express = require("express");
const router = express.Router();
const { submitConfounder } = require("../controllers/confounderController");

router.post("/", submitConfounder);

module.exports = router;
