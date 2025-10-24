/**
 * Industry Configuration Middleware
 * Injects industry configuration into request object based on user's company
 *
 * This middleware loads the appropriate industry configuration (generic, school, etc.)
 * based on the authenticated user's company settings and makes it available
 * throughout the request lifecycle via req.industryConfig
 */

const { loadIndustryConfig } = require('../config/industry/configLoader');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Load and inject industry configuration into request
 *
 * @middleware
 * @description Fetches company's industry_type and loads corresponding configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const injectIndustryConfig = async (req, res, next) => {
  try {
    // Skip if no authenticated user (will use generic config)
    if (!req.user || !req.user.company_id) {
      console.log('⚠️ No authenticated user or company_id, using generic config');
      req.industryConfig = loadIndustryConfig('generic');
      req.industryType = 'generic';
      return next();
    }

    console.log(`🔧 Loading industry config for company: ${req.user.company_id}`);

    // Get company's industry type from database
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('industry_type, name')
      .eq('id', req.user.company_id)
      .single();

    if (error) {
      console.error('❌ Failed to load company industry type:', error.message);
      // Fallback to generic config on error
      req.industryConfig = loadIndustryConfig('generic');
      req.industryType = 'generic';
      return next();
    }

    // Load industry configuration
    const industryType = company?.industry_type || 'generic';
    req.industryConfig = loadIndustryConfig(industryType);
    req.industryType = industryType;

    console.log(`✅ Loaded ${industryType} config for company: ${company.name}`);

    next();
  } catch (error) {
    console.error('❌ Industry config middleware error:', error);
    // On any error, fallback to generic config and continue
    req.industryConfig = loadIndustryConfig('generic');
    req.industryType = 'generic';
    next();
  }
};

/**
 * Validate that industry configuration was properly loaded
 * Use this middleware after injectIndustryConfig to ensure config exists
 *
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireIndustryConfig = (req, res, next) => {
  if (!req.industryConfig) {
    console.error('❌ Industry config not found in request object');
    return res.status(500).json({
      success: false,
      message: 'Industry configuration not loaded'
    });
  }
  next();
};

module.exports = {
  injectIndustryConfig,
  requireIndustryConfig
};
