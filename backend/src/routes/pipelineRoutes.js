const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Pipeline stage management routes
router.get('/stages', pipelineController.getStages);
router.post('/stages', pipelineController.createStage);
router.put('/stages/:id', pipelineController.updateStage);
router.delete('/stages/:id', pipelineController.deleteStage);
router.put('/stages/reorder', pipelineController.reorderStages);

// Pipeline operations routes
router.get('/overview', pipelineController.getPipelineOverview);
router.get('/conversion-rates', pipelineController.getConversionRates);

module.exports = router;
