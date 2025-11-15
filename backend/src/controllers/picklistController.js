const { validationResult } = require('express-validator');
const {
  getLeadPicklists,
  createPicklistOption,
  updatePicklistOption,
  deletePicklistOption,
  reorderPicklistOptions
} = require('../services/picklistService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Picklist Controller
 * Handles picklist option management for leads
 * Extends BaseController for standardized patterns
 */
class PicklistController extends BaseController {
  /**
   * List lead picklists
   */
  listLeadPicklists = asyncHandler(async (req, res) => {
    const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';
    const companyId = req.user?.company_id || null;

    const picklists = await getLeadPicklists(companyId, {
      includeInactive,
      forceRefresh: req.query.forceRefresh === 'true'
    });

    this.success(res, picklists, 200, 'Picklists retrieved successfully');
  });

  /**
   * Create lead picklist option
   */
  createLeadPicklistOption = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const companyId = req.user?.company_id || null;

    if (!companyId && req.user?.role !== 'super_admin') {
      throw ApiError.forbidden('Company context is required');
    }

    const { type, label, value, sortOrder, isActive } = req.body;

    // Super admins can create global options by explicitly passing scope
    const targetCompanyId = req.user?.role === 'super_admin' && req.body.scope === 'global'
      ? null
      : companyId;

    const option = await createPicklistOption({
      companyId: targetCompanyId,
      type,
      value,
      label,
      sortOrder,
      isActive,
      createdBy: req.user?.id
    });

    const picklists = await getLeadPicklists(targetCompanyId || companyId, {
      includeInactive: true,
      forceRefresh: true
    });

    this.created(res, { option, picklists }, 'Picklist option created successfully');
  });

  /**
   * Update lead picklist option
   */
  updateLeadPicklistOption = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const companyId = req.user?.company_id || null;
    const targetCompanyId = req.user?.role === 'super_admin' && req.body.scope === 'global'
      ? null
      : companyId;

    const option = await updatePicklistOption(req.params.id, req.body, { companyId: targetCompanyId });

    const picklists = await getLeadPicklists(targetCompanyId || companyId, {
      includeInactive: true,
      forceRefresh: true
    });

    this.updated(res, { option, picklists }, 'Picklist option updated successfully');
  });

  /**
   * Delete lead picklist option
   */
  deleteLeadPicklistOption = asyncHandler(async (req, res) => {
    const companyId = req.user?.company_id || null;
    const targetCompanyId = req.user?.role === 'super_admin' && req.query.scope === 'global'
      ? null
      : companyId;

    await deletePicklistOption(req.params.id, { companyId: targetCompanyId });

    const picklists = await getLeadPicklists(targetCompanyId || companyId, {
      includeInactive: true,
      forceRefresh: true
    });

    this.success(res, picklists, 200, 'Picklist option deleted successfully');
  });

  /**
   * Reorder lead picklist options
   */
  reorderLeadPicklistOptions = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const { type, orderedIds } = req.body;
    const companyId = req.user?.company_id || null;
    const targetCompanyId = req.user?.role === 'super_admin' && req.body.scope === 'global'
      ? null
      : companyId;

    await reorderPicklistOptions(type, orderedIds, { companyId: targetCompanyId });

    const picklists = await getLeadPicklists(targetCompanyId || companyId, {
      includeInactive: true,
      forceRefresh: true
    });

    this.success(res, picklists, 200, 'Picklist order updated successfully');
  });
}

module.exports = new PicklistController();
