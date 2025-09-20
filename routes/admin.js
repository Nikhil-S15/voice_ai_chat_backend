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

// Voice recordings endpoints
router.get('/patient/:patientId/recordings', adminController.getPatientVoiceRecordings);
router.get('/voice-recordings', adminController.getVoiceRecordingsAdmin);

// Recording download endpoints
router.get('/recordings/:recordingId/download', adminController.downloadRecordingAdmin);
router.get('/recordings/:recordingId/download-wav', adminController.downloadRecordingWav); // ADD THIS LINE

// Export endpoints
router.get('/export-comprehensive', adminController.exportComprehensiveData);
router.get('/patient/:patientId/export', adminController.exportPatientData);

// Statistics
router.get('/statistics', adminController.getStatistics);

// Patient management endpoints
router.put('/patient/:patientId/update', adminController.updatePatientInfo);
router.delete('/patient/:patientId/delete', adminController.deletePatient);

// Voice analysis summary
router.get('/voice-analysis-summary', adminController.getVoiceAnalysisSummary);

// Export filtered patients
router.get('/export-filtered', adminController.exportFilteredPatients);

module.exports = router;