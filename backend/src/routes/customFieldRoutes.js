const express = require('express');
const router = express.Router();
const customFieldController = require('../controllers/customFieldController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Get all custom fields (with optional filters)
router.get('/', customFieldController.getCustomFields);

// Get all custom fields usage statistics
router.get('/usage/all', customFieldController.getAllCustomFieldsUsage);

// Reorder custom fields (requires manager or admin)
router.post('/reorder', requireRole(['company_admin', 'manager']), customFieldController.reorderCustomFields);

// Validate custom fields
router.post('/validate', customFieldController.validateCustomFields);

// Get a single custom field by ID
router.get('/:id', customFieldController.getCustomFieldById);

// Get custom field usage statistics
router.get('/:id/usage', customFieldController.getCustomFieldUsage);

// Create a new custom field (requires manager or admin)
router.post('/', requireRole(['company_admin', 'manager']), customFieldController.createCustomField);

// Update a custom field (requires manager or admin)
router.put('/:id', requireRole(['company_admin', 'manager']), customFieldController.updateCustomField);

// Delete a custom field (requires admin)
router.delete('/:id', requireRole(['company_admin']), customFieldController.deleteCustomField);

module.exports = router;

