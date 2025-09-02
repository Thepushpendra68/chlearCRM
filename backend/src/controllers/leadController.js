const { validationResult } = require('express-validator');
const leadService = require('../services/leadService');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all leads with pagination, search, and filtering
 * @route   GET /api/leads
 * @access  Private
 */
const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      source = '',
      assigned_to = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search,
      status,
      source,
      assigned_to,
      sort_by,
      sort_order
    };

    const result = await leadService.getLeads(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.json({
      success: true,
      data: result.leads,
      pagination: {
        current_page: parseInt(page),
        total_pages: result.totalPages,
        total_items: result.totalItems,
        items_per_page: parseInt(limit),
        has_next: parseInt(page) < result.totalPages,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lead by ID
 * @route   GET /api/leads/:id
 * @access  Private
 */
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);

    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new lead
 * @route   POST /api/leads
 * @access  Private
 */
const createLead = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400, errors.array());
    }

    const leadData = {
      ...req.body,
      created_by: req.user.id
    };

    const lead = await leadService.createLead(leadData);

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update lead
 * @route   PUT /api/leads/:id
 * @access  Private
 */
const updateLead = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const leadData = req.body;

    const lead = await leadService.updateLead(id, leadData, req.user);

    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    res.json({
      success: true,
      data: lead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete lead
 * @route   DELETE /api/leads/:id
 * @access  Private
 */
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await leadService.deleteLead(id, req.user);

    if (!deleted) {
      throw new ApiError('Lead not found', 404);
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lead statistics
 * @route   GET /api/leads/stats
 * @access  Private
 */
const getLeadStats = async (req, res, next) => {
  try {
    const stats = await leadService.getLeadStats(req.user);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
};
