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

  /**
   * Get lead import telemetry summary for the platform dashboard
   */
  async getImportTelemetry(rangeKey = '30d', limit = 20) {
    const range = resolveRange(rangeKey);
    const now = Date.now();
    const periodStart = new Date(now - range.days * MS_PER_DAY).toISOString();

    let telemetryRows = [];

    try {
      const { data, error } = await supabaseAdmin
        .from('import_telemetry')
        .select('*')
        .gte('created_at', periodStart)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        if (error.code === '42P01') {
          return this.buildTelemetryPayload([], range, limit);
        }
        throw error;
      }

      telemetryRows = Array.isArray(data) ? data : [];
    } catch (error) {
      if (error?.code === '42P01') {
        return this.buildTelemetryPayload([], range, limit);
      }
      console.error('Failed to fetch import telemetry:', error);
      throw new ApiError('Failed to fetch import telemetry', 500);
    }

    return this.buildTelemetryPayload(telemetryRows, range, limit);
  }

  async buildTelemetryPayload(rows, range, limit = 20) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        range: {
          key: range.key,
          label: range.label,
          days: range.days,
          start: range.days ? new Date(Date.now() - range.days * MS_PER_DAY).toISOString() : null
        },
        summary: {
          totalRuns: 0,
          dryRuns: 0,
          imports: 0,
          successRate: 0,
          totalRowsValidated: 0,
          totalRowsImported: 0,
          totalWarnings: 0,
          totalErrors: 0,
          avgDurationMs: 0,
          p95DurationMs: 0
        },
        duplicatePolicies: [],
        topCompanies: [],
        recent: []
      };
    }

    const dryRuns = [];
    const imports = [];
    const durations = [];
    const duplicatePolicyCounts = new Map();
    const companyStats = new Map();

    const safeNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    rows.forEach((row) => {
      const stats = row?.stats || {};
      const metadata = row?.metadata || {};
      const companyId = row?.company_id || null;

      if (row?.duration_ms !== null && row?.duration_ms !== undefined) {
        const normalizedDuration = safeNumber(row.duration_ms);
        if (normalizedDuration > 0) {
          durations.push(normalizedDuration);
        }
      }

      if (row?.duplicate_policy) {
        const key = row.duplicate_policy;
        duplicatePolicyCounts.set(key, (duplicatePolicyCounts.get(key) || 0) + 1);
      }

      const targetCollection = row?.phase === 'import' ? imports : dryRuns;
      targetCollection.push(row);

      if (companyId) {
        const existing = companyStats.get(companyId) || {
          companyId,
          runs: 0,
          dryRuns: 0,
          imports: 0,
          warnings: 0,
          errors: 0,
          rowsValidated: 0,
          rowsImported: 0,
          lastSeen: row?.created_at || null
        };

        existing.runs += 1;
        if (row?.phase === 'import') {
          existing.imports += 1;
          existing.rowsImported += safeNumber(metadata.inserted_count ?? stats.valid);
        } else {
          existing.dryRuns += 1;
        }

        existing.warnings += safeNumber(row?.warning_count);
        existing.errors += safeNumber(row?.error_count);
        existing.rowsValidated += safeNumber(stats.total);

        if (!existing.lastSeen || (row?.created_at && row.created_at > existing.lastSeen)) {
          existing.lastSeen = row.created_at;
        }

        companyStats.set(companyId, existing);
      }
    });

    const totalRuns = rows.length;
    const totalDryRuns = dryRuns.length;
    const totalImports = imports.length;

    const totalWarnings = rows.reduce((acc, row) => acc + safeNumber(row?.warning_count), 0);
    const totalErrors = rows.reduce((acc, row) => acc + safeNumber(row?.error_count), 0);
    const totalRowsValidated = rows.reduce((acc, row) => acc + safeNumber(row?.stats?.total), 0);
    const totalRowsImported = imports.reduce(
      (acc, row) => acc + safeNumber(row?.metadata?.inserted_count ?? row?.stats?.valid),
      0
    );
    const successfulImports = imports.filter((row) => safeNumber(row?.error_count) === 0).length;
    const successRate = totalImports > 0 ? (successfulImports / totalImports) * 100 : 0;

    durations.sort((a, b) => a - b);
    const avgDurationMs =
      durations.length > 0
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : 0;
    const p95DurationMs =
      durations.length > 0
        ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]
        : 0;

    const duplicatePolicies = Array.from(duplicatePolicyCounts.entries())
      .map(([policy, count]) => ({ policy, count }))
      .sort((a, b) => b.count - a.count);

    const companyIds = Array.from(companyStats.keys());
    let companyLookup = {};

    if (companyIds.length > 0) {
      try {
        const { data, error } = await supabaseAdmin
          .from('companies')
          .select('id, name')
          .in('id', companyIds);

        if (!error && Array.isArray(data)) {
          companyLookup = data.reduce((acc, company) => {
            acc[company.id] = company.name;
            return acc;
          }, {});
        }
      } catch (error) {
        console.warn('Failed to fetch company names for telemetry view:', error);
      }
    }

    const topCompanies = Array.from(companyStats.values())
      .map((stat) => ({
        companyId: stat.companyId,
        companyName: companyLookup[stat.companyId] || 'Unknown company',
        runs: stat.runs,
        dryRuns: stat.dryRuns,
        imports: stat.imports,
        warnings: stat.warnings,
        errors: stat.errors,
        rowsValidated: stat.rowsValidated,
        rowsImported: stat.rowsImported,
        lastSeen: stat.lastSeen
      }))
      .sort((a, b) => {
        if (b.errors !== a.errors) {
          return b.errors - a.errors;
        }
        if (b.rowsImported !== a.rowsImported) {
          return b.rowsImported - a.rowsImported;
        }
        return (b.lastSeen || '').localeCompare(a.lastSeen || '');
      })
      .slice(0, 10);

    const recent = rows.slice(0, Math.max(5, Math.min(limit, 50))).map((row) => ({
      id: row.id,
      phase: row.phase,
      companyId: row.company_id,
      companyName: companyLookup[row.company_id] || null,
      createdAt: row.created_at,
      stats: row.stats || {},
      warningCount: safeNumber(row.warning_count),
      errorCount: safeNumber(row.error_count),
      duplicatePolicy: row.duplicate_policy || null,
      configVersion: row.config_version || null,
      durationMs: row.duration_ms || null,
      insertedCount: safeNumber(row?.metadata?.inserted_count ?? row?.stats?.valid),
      fileName: row?.metadata?.file_name || null
    }));

    return {
      range: {
        key: range.key,
        label: range.label,
        days: range.days,
        start: range.days ? new Date(Date.now() - range.days * MS_PER_DAY).toISOString() : null
      },
      summary: {
        totalRuns,
        dryRuns: totalDryRuns,
        imports: totalImports,
        successRate: Math.round(successRate * 10) / 10,
        totalRowsValidated,
        totalRowsImported,
        totalWarnings,
        totalErrors,
        avgDurationMs,
        p95DurationMs
      },
      duplicatePolicies,
      topCompanies,
      recent
    };
  }
}

module.exports = new PlatformService();
