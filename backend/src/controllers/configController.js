/**
 * Configuration Controller
 * Provides industry-specific configuration to the frontend
 */

const configLoader = require('../config/industry/configLoader');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Config Controller
 * Handles configuration operations
 * Extends BaseController for standardized patterns
 */
class ConfigController extends BaseController {
  /**
   * Get industry configuration for current user's company
   */
  getIndustryConfig = asyncHandler(async (req, res) => {
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
    this.success(res, {
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
    }, 200, 'Industry configuration retrieved successfully');
  });

  /**
   * Get form layout for current user's company
   */
  getFormLayout = asyncHandler(async (req, res) => {
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

    this.success(res, {
      formLayout,
      terminology: config.terminology,
    }, 200, 'Form layout retrieved successfully');
  });

  /**
   * Get all available industries
   */
  getAvailableIndustries = asyncHandler(async (req, res) => {
    const industries = configLoader.getAvailableIndustries();

    this.success(res, industries, 200, 'Available industries retrieved successfully');
  });

  /**
   * Get terminology for current user's company
   */
  getTerminology = asyncHandler(async (req, res) => {
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

    this.success(res, config.terminology, 200, 'Terminology retrieved successfully');
  });

  /**
   * Get field definitions for current user's company
   */
  getFieldDefinitions = asyncHandler(async (req, res) => {
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

    this.success(res, {
      coreFields: config.coreFields,
      customFields: config.customFields,
      allFields,
    }, 200, 'Field definitions retrieved successfully');
  });
}

module.exports = new ConfigController();
