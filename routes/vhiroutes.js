const express = require('express');
const router = express.Router();
const vhiController = require('../controllers/vhiController');

// Submit VHI assessment
router.post('/submit', vhiController.submitVHI);

// Get VHI history for a user
router.get('/history/:userId', vhiController.getVHIHistory);

// Get VHI questions in specified language
router.get('/questions/:language', vhiController.getVHIQuestions);

module.exports = router;