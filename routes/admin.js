// routes/admin.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Admin authentication
router.post('/login', adminController.adminLogin);

// Apply auth middleware to all routes below
router.use(authMiddleware.verifyAdminToken);

// Patient data endpoints
router.get('/patient-analysis', adminController.getPatientAnalysisData);
router.get('/patient/:patientId/profile', adminController.getPatientDetailedProfile);

// Clinical notes and analysis endpoints
router.post('/patient/:patientId/clinical-notes', adminController.submitClinicalNotes);
router.post('/patient/:patientId/analyze-voice', adminController.analyzePatientVoiceProgression);

// ✅ FIXED: Use the correct function name
router.get('/patient/:patientId/recordings', adminController.getVoiceRecordingsAdmin);

// Export endpoints
router.get('/export-comprehensive', adminController.exportComprehensiveData);

// Statistics
router.get('/statistics', adminController.getStatistics);

// Patient data export
router.get('/patient/:patientId/export', adminController.exportPatientData);

// Download recording in WAV format
router.get('/recordings/:recordingId/download-wav', adminController.downloadRecordingWav);

// Update patient information
router.put('/patient/:patientId/update', adminController.updatePatientInfo);

// Delete patient
router.delete('/patient/:patientId/delete', adminController.deletePatient);

module.exports = router;