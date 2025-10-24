/**
 * Configuration Controller
 * Provides industry-specific configuration to the frontend
 */

const configLoader = require('../config/industry/configLoader');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Get industry configuration for current user's company
 * GET /api/config/industry
 */
const getIndustryConfig = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user || !user.company_id) {
      throw new ApiError('User company not found', 400);
    }

    // Get company to load industry configuration
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, industry_type')
      .eq('id', user.company_id)
      .single();

    if (companyError || !company) {
      throw new ApiError('Company not found', 404);
    }

    // Load industry configuration
    const config = configLoader.getConfigForCompany(company);

    // Return configuration with company info
    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          industry_type: company.industry_type || 'generic',
        },
        config: {
          industryType: config.industryType,
          industryName: config.industryName,
          terminology: config.terminology,
          coreFields: config.coreFields,
          customFields: config.customFields,
          formLayout: config.formLayout,
          listView: config.listView,
          pipeline: config.pipeline,
          validation: config.validation,
          reports: config.reports,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching industry config:', error);
    next(error);
  }
};

/**
 * Get form layout for current user's company
 * GET /api/config/form-layout
 */
const getFormLayout = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user || !user.company_id) {
      throw new ApiError('User company not found', 400);
    }

    // Get company to load industry configuration
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('industry_type')
      .eq('id', user.company_id)
      .single();

    if (companyError || !company) {
      throw new ApiError('Company not found', 404);
    }

    // Load industry configuration
    const config = configLoader.getConfigForCompany(company);

    // Get formatted form layout with field definitions
    const formLayout = configLoader.getFormLayout(config);

    res.json({
      success: true,
      data: {
        formLayout,
        terminology: config.terminology,
      },
    });
  } catch (error) {
    console.error('Error fetching form layout:', error);
    next(error);
  }
};

/**
 * Get all available industries
 * GET /api/config/industries
 */
const getAvailableIndustries = async (req, res, next) => {
  try {
    const industries = configLoader.getAvailableIndustries();

    res.json({
      success: true,
      data: industries,
    });
  } catch (error) {
    console.error('Error fetching available industries:', error);
    next(error);
  }
};

/**
 * Get terminology for current user's company
 * GET /api/config/terminology
 */
const getTerminology = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user || !user.company_id) {
      throw new ApiError('User company not found', 400);
    }

    // Get company to load industry configuration
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('industry_type')
      .eq('id', user.company_id)
      .single();

    if (companyError || !company) {
      throw new ApiError('Company not found', 404);
    }

    // Load industry configuration
    const config = configLoader.getConfigForCompany(company);

    res.json({
      success: true,
      data: config.terminology,
    });
  } catch (error) {
    console.error('Error fetching terminology:', error);
    next(error);
  }
};

/**
 * Get field definitions for current user's company
 * GET /api/config/fields
 */
const getFieldDefinitions = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user || !user.company_id) {
      throw new ApiError('User company not found', 400);
    }

    // Get company to load industry configuration
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('industry_type')
      .eq('id', user.company_id)
      .single();

    if (companyError || !company) {
      throw new ApiError('Company not found', 404);
    }

    // Load industry configuration
    const config = configLoader.getConfigForCompany(company);

    // Get all fields (core + custom)
    const allFields = configLoader.getAllFields(config);

    res.json({
      success: true,
      data: {
        coreFields: config.coreFields,
        customFields: config.customFields,
        allFields,
      },
    });
  } catch (error) {
    console.error('Error fetching field definitions:', error);
    next(error);
  }
};

module.exports = {
  getIndustryConfig,
  getFormLayout,
  getAvailableIndustries,
  getTerminology,
  getFieldDefinitions,
};
