const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const userService = require('./userService');

/**
 * Platform Service for Super Admin Operations
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const RANGE_CONFIG = {
  '7d': { days: 7, label: 'Last 7 days' },
  '30d': { days: 30, label: 'Last 30 days' },
  '90d': { days: 90, label: 'Last 90 days' },
  '1y': { days: 365, label: 'Last year' }
};

function resolveRange(rangeKey = '30d') {
  const normalizedKey = typeof rangeKey === 'string' ? rangeKey.toLowerCase() : '30d';
  return {
    key: RANGE_CONFIG[normalizedKey] ? normalizedKey : '30d',
    ...RANGE_CONFIG[RANGE_CONFIG[normalizedKey] ? normalizedKey : '30d']
  };
}

async function countFrom(table, metricName, configureQuery = (query) => query) {
  let query = supabaseAdmin
    .from(table)
    .select('*', { head: true, count: 'exact' });

  if (typeof configureQuery === 'function') {
    const configured = configureQuery(query);
    if (configured) {
      query = configured;
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error(`Error fetching count for ${metricName}:`, error);
    throw new ApiError(`Failed to fetch ${metricName}`, 500);
  }

  return count || 0;
}

class PlatformService {
  /**
   * Get all companies with statistics
   */
  async getCompanies({ page = 1, limit = 20, search = '', status = null }) {
    let query = supabaseAdmin
      .from('platform_company_stats')
      .select('*', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,company_slug.ilike.%${search}%`);
    }

    // Status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching companies:', error);
      throw new ApiError('Failed to fetch companies', 500);
    }

    return {
      companies: data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get platform overview statistics
   */
  async getPlatformStats(rangeKey = '30d') {
    const range = resolveRange(rangeKey);
    const now = Date.now();
    const periodStart = new Date(now - range.days * MS_PER_DAY).toISOString();
    const activitiesWindowDays = Math.min(range.days, 7);
    const activitiesStart = new Date(now - activitiesWindowDays * MS_PER_DAY).toISOString();

    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      newCompaniesPeriod,
      totalUsers,
      activeUsers,
      newUsersPeriod,
      activeUsersPeriod,
      totalLeads,
      leadsCreatedPeriod,
      totalActivities,
      activitiesPeriod,
      activities7d
    ] = await Promise.all([
      countFrom('companies', 'total companies'),
      countFrom('companies', 'active companies', (query) => query.eq('status', 'active')),
      countFrom('companies', 'trial companies', (query) => query.eq('status', 'trial')),
      countFrom('companies', 'new companies for period', (query) => query.gte('created_at', periodStart)),
      countFrom('user_profiles', 'total users'),
      countFrom('user_profiles', 'active users', (query) => query.eq('is_active', true)),
      countFrom('user_profiles', 'new users for period', (query) => query.gte('created_at', periodStart)),
      countFrom('user_profiles', 'active users for period', (query) => query.gte('last_login_at', periodStart)),
      countFrom('leads', 'total leads'),
      countFrom('leads', 'leads created for period', (query) => query.gte('created_at', periodStart)),
      countFrom('activities', 'total activities'),
      countFrom('activities', 'activities for period', (query) => query.gte('created_at', periodStart)),
      countFrom('activities', 'activities 7d window', (query) => query.gte('created_at', activitiesStart))
    ]);

    const stats = {
      total_companies: totalCompanies,
      active_companies: activeCompanies,
      trial_companies: trialCompanies,
      total_users: totalUsers,
      active_users: activeUsers,
      total_leads: totalLeads,
      total_activities: totalActivities,
      active_users_period: activeUsersPeriod,
      leads_created_period: leadsCreatedPeriod,
      new_companies_period: newCompaniesPeriod,
      new_users_period: newUsersPeriod,
      activities_period: activitiesPeriod,
      activities_7d: activities7d,
      period_key: range.key,
      period_days: range.days,
      period_label: range.label
    };

    if (range.key === '30d') {
      stats.active_users_30d = activeUsersPeriod;
      stats.leads_created_30d = leadsCreatedPeriod;
      stats.new_companies_30d = newCompaniesPeriod;
      stats.new_users_30d = newUsersPeriod;
    }

    return stats;
  }

  /**
   * Get company details with full information
   */
  async getCompanyDetails(companyId) {
    // Get company info
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new ApiError('Company not found', 404);
    }

    // Get users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, role, is_active, created_at')
      .eq('company_id', companyId);

    // Get stats
    const { data: stats } = await supabaseAdmin
      .from('platform_company_stats')
      .select('*')
      .eq('company_id', companyId)
      .single();

    return {
      company,
      users: users || [],
      stats: stats || {}
    };
  }

  /**
   * Suspend/Activate company
   */
  async updateCompanyStatus(companyId, status, reason = null) {
    const validStatuses = ['active', 'suspended', 'trial', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new ApiError('Invalid status', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('companies')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating company status:', error);
      throw new ApiError('Failed to update company status', 500);
    }

    return data;
  }

  /**
   * Get all users across platform (for super admin search)
   */
  async searchUsers({ search = '', companyId = null, role = null, limit = 20 }) {
    let query = supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        company_id,
        role,
        first_name,
        last_name,
        is_active,
        created_at,
        companies(name, company_slug)
      `)
      .limit(limit);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Error searching users:', error);
      throw new ApiError('Failed to search users', 500);
    }

    // Get emails from auth
    const usersWithEmail = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        return {
          ...profile,
          email: authUser?.user?.email || null,
          company_name: profile.companies?.name || null,
          company_slug: profile.companies?.company_slug || null
        };
      })
    );

    return usersWithEmail;
  }

  async createUserForCompany(currentUser, userData) {
    if (currentUser.role !== 'super_admin') {
      throw new ApiError('Only super admins can create users across companies', 403);
    }

    const companyId = userData.company_id;

    if (!companyId) {
      throw new ApiError('Target company is required', 400);
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new ApiError('Target company not found', 404);
    }

    const payload = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'sales_rep',
      company_id: companyId
    };

    const createdUser = await userService.createUser(payload, {
      ...currentUser,
      company_id: companyId
    });

    if (userData.is_active === false) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', createdUser.id)
        .eq('company_id', companyId);

      createdUser.is_active = false;
    }

    return {
      ...createdUser,
      company_name: createdUser.company_name || company.name
    };
  }
}

module.exports = new PlatformService();
