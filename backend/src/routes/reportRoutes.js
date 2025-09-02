const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Standard reports
router.get('/lead-performance', reportController.getLeadPerformance);
router.get('/conversion-funnel', reportController.getConversionFunnel);
router.get('/activity-summary', reportController.getActivitySummary);
router.get('/team-performance', reportController.getTeamPerformance);
router.get('/pipeline-health', reportController.getPipelineHealth);

// Custom reports
router.post('/custom', reportController.generateCustomReport);

// Export functionality
router.post('/export/:type', reportController.exportReport);

// Scheduled reports
router.get('/scheduled', reportController.getScheduledReports);
router.post('/schedule', reportController.scheduleReport);

// Report configuration
router.get('/templates', reportController.getReportTemplates);
router.get('/options', reportController.getReportOptions);

module.exports = router;
