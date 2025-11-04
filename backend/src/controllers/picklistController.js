const { validationResult } = require('express-validator');
const {
  getLeadPicklists,
  createPicklistOption,
  updatePicklistOption,
  deletePicklistOption,
  reorderPicklistOptions
} = require('../services/picklistService');
const ApiError = require('../utils/ApiError');

const formatValidationErrors = (errors) => {
  const errorMessages = errors.array().map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));

  const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

  return {
    success: false,
    message: 'Validation failed',
    errors: errorMessages,
    error: {
      message: `Please check the following fields: ${fieldErrors}`,
      code: 'VALIDATION_ERROR'
    }
  };
};

const listLeadPicklists = async (req, res, next) => {
  try {
    const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';
    const companyId = req.user?.company_id || null;

    const picklists = await getLeadPicklists(companyId, {
      includeInactive,
      forceRefresh: req.query.forceRefresh === 'true'
    });

    res.json({
      success: true,
      data: picklists
    });
  } catch (error) {
    next(error);
  }
};

const createLeadPicklistOption = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(formatValidationErrors(errors));
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

    res.status(201).json({
      success: true,
      data: option,
      picklists
    });
  } catch (error) {
    next(error);
  }
};

const updateLeadPicklistOption = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(formatValidationErrors(errors));
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

    res.json({
      success: true,
      data: option,
      picklists
    });
  } catch (error) {
    next(error);
  }
};

const deleteLeadPicklistOption = async (req, res, next) => {
  try {
    const companyId = req.user?.company_id || null;
    const targetCompanyId = req.user?.role === 'super_admin' && req.query.scope === 'global'
      ? null
      : companyId;

    await deletePicklistOption(req.params.id, { companyId: targetCompanyId });

    const picklists = await getLeadPicklists(targetCompanyId || companyId, {
      includeInactive: true,
      forceRefresh: true
    });

    res.json({
      success: true,
      message: 'Picklist option deleted',
      picklists
    });
  } catch (error) {
    next(error);
  }
};

const reorderLeadPicklistOptions = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(formatValidationErrors(errors));
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

    res.json({
      success: true,
      message: 'Picklist order updated',
      picklists
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLeadPicklists,
  createLeadPicklistOption,
  updateLeadPicklistOption,
  deleteLeadPicklistOption,
  reorderLeadPicklistOptions
};
