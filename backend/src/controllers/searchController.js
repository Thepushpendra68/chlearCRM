const searchService = require('../services/searchService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Search Controller
 * Handles global search operations
 * Extends BaseController for standardized patterns
 */
class SearchController extends BaseController {
  /**
   * Global search across all modules
   */
  globalSearch = asyncHandler(async (req, res) => {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 1) {
      throw new ApiError('Search query cannot be empty', 400);
    }

    const results = await searchService.globalSearch(parseInt(limit));

    this.success(res, results, 200, 'Search completed successfully');
  });

  /**
   * Get search suggestions
   */
  getSuggestions = asyncHandler(async (req, res) => {
    const { q: query } = req.query;

    if (!query || query.trim().length < 1) {
      return this.success(res, [], 200, 'Suggestions retrieved successfully');
    }

    const suggestions = await searchService.getSuggestions(query);

    this.success(res, suggestions, 200, 'Suggestions retrieved successfully');
  });
}

module.exports = new SearchController();
