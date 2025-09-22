const searchService = require('../services/searchService');
const ApiError = require('../utils/ApiError');

/**
 * Global search across all modules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalSearch = async (req, res, next) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query cannot be empty'
        }
      });
    }

    const results = await searchService.globalSearch(query, parseInt(limit));
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getSuggestions = async (req, res, next) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await searchService.getSuggestions(query);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
  getSuggestions
};
