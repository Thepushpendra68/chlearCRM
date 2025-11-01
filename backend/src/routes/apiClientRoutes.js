const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createApiClient,
  getApiClients,
  getApiClientById,
  updateApiClient,
  regenerateSecret,
  deleteApiClient,
  getApiClientStats
} = require('../controllers/apiClientController');

const router = express.Router();

// All routes require authentication and company_admin role
router.use(authenticate);
router.use(authorize(['company_admin', 'super_admin']));

/**
 * @route   GET /api/api-clients
 * @desc    Get all API clients for company
 * @access  Private (Admin only)
 */
router.get('/', getApiClients);

/**
 * @route   POST /api/api-clients
 * @desc    Create new API client
 * @access  Private (Admin only)
 */
router.post('/', createApiClient);

/**
 * @route   GET /api/api-clients/:id
 * @desc    Get API client by ID
 * @access  Private (Admin only)
 */
router.get('/:id', getApiClientById);

/**
 * @route   PUT /api/api-clients/:id
 * @desc    Update API client
 * @access  Private (Admin only)
 */
router.put('/:id', updateApiClient);

/**
 * @route   POST /api/api-clients/:id/regenerate-secret
 * @desc    Regenerate API secret
 * @access  Private (Admin only)
 */
router.post('/:id/regenerate-secret', regenerateSecret);

/**
 * @route   DELETE /api/api-clients/:id
 * @desc    Delete API client
 * @access  Private (Admin only)
 */
router.delete('/:id', deleteApiClient);

/**
 * @route   GET /api/api-clients/:id/stats
 * @desc    Get API client usage statistics
 * @access  Private (Admin only)
 */
router.get('/:id/stats', getApiClientStats);

module.exports = router;

