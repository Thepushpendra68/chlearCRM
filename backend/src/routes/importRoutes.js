const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Import operations
router.post('/leads', importController.getUploadMiddleware(), importController.importLeads);
router.post('/leads/dry-run', importController.getUploadMiddleware(), importController.dryRunLeads);
router.get('/template', importController.getImportTemplate);
router.get('/history', importController.getImportHistory);
router.post('/validate', importController.getUploadMiddleware(), importController.validateImportFile);
router.post('/headers', importController.getUploadMiddleware(), importController.getFileHeaders);

// Export operations
router.get('/export/leads', importController.exportLeads);

module.exports = router;
