const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Activity management routes
router.get('/', activityController.getActivities);
router.get('/stats', activityController.getActivityStats);
router.get('/trends', activityController.getActivityTrends);
router.get('/:id', activityController.getActivityById);
router.post('/', activityController.createActivity);
router.post('/bulk', activityController.createBulkActivities);
router.put('/:id', activityController.updateActivity);
router.put('/:id/complete', activityController.completeActivity);
router.delete('/:id', activityController.deleteActivity);

// Timeline and history routes
router.get('/leads/:id/timeline', activityController.getLeadTimeline);
router.get('/leads/:id/timeline/summary', activityController.getLeadTimelineSummary);
router.get('/leads/:id/activities', activityController.getLeadActivities);
router.get('/users/:id/activities', activityController.getUserActivities);
router.get('/users/:id/timeline', activityController.getUserTimeline);
router.get('/team/timeline', activityController.getTeamTimeline);

module.exports = router;
