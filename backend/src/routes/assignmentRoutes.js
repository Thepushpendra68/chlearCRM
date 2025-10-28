const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Assignment rule management routes
router.get('/rules', assignmentController.getRules);
router.get('/rules/active', assignmentController.getActiveRules);
router.get('/rules/:id', assignmentController.getRuleById);
router.post('/rules', assignmentController.createRule);
router.put('/rules/:id', assignmentController.updateRule);
router.delete('/rules/:id', assignmentController.deleteRule);

// Lead assignment operations
router.post('/leads/:leadId/assign', assignmentController.assignLead);
router.post('/leads/bulk-assign', assignmentController.bulkAssignLeads);
router.get('/leads/:leadId/assignment-history', assignmentController.getLeadAssignmentHistory);
router.post('/leads/:leadId/auto-assign', assignmentController.autoAssignLead);
router.post('/leads/:leadId/reassign', assignmentController.reassignLead);
router.get('/leads/:leadId/recommendations', assignmentController.getAssignmentRecommendations);

// Bulk operations
router.post('/leads/bulk-auto-assign', assignmentController.processBulkAutoAssignment);

// Team management
router.get('/workload', assignmentController.getTeamWorkload);
router.get('/history', assignmentController.getAssignmentHistory);
router.post('/redistribute', assignmentController.redistributeLeads);

// Statistics and analytics
router.get('/stats', assignmentController.getAssignmentStats);
router.get('/routing-stats', assignmentController.getRoutingStats);

module.exports = router;
