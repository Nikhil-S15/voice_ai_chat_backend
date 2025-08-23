const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const acousticTaskController = require('../controllers/acousticTaskController');

// Assign tasks based on patient condition
router.post('/assign-tasks', acousticTaskController.assignTasks);

// Upload audio recording
router.post(
  '/upload-recording', 
  upload.single('audio'), 
  acousticTaskController.uploadRecording
);

// Submit GRBAS ratings (for clinicians)
router.post('/submit-grbas', acousticTaskController.submitGRBAS);

module.exports = router;