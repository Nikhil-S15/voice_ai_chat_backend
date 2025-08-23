const express = require("express");
const { submitOralCancer } = require("../controllers/oralCancerController");
const router = express.Router();

router.post("/", submitOralCancer);

module.exports = router;
