const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const searchController = require('../controllers/searchController');

const router = express.Router();

// All search routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/search
 * @desc    Global search across all modules
 * @access  Private
 */
router.get('/', searchController.globalSearch);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions
 * @access  Private
 */
router.get('/suggestions', searchController.getSuggestions);

module.exports = router;
