const { supabaseAdmin, getSupabaseForUser } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');
const picklistService = require('./picklistService');

const FALLBACK_WON_STATUSES = ['converted', 'won'];
const FALLBACK_LOST_STATUSES = ['lost'];

const getLeadStatusSegments = async (companyId) => {
  try {
    const picklists = await picklistService.getLeadPicklists(companyId, { includeInactive: false });
    const won = new Set();
    const lost = new Set();

    picklists.statuses.forEach((option) => {
      const metadata = option.metadata || {};
      const value = option.value;

      const matchesWonValue = ['converted', 'won', 'closed_won'].includes(value);
      const metadataWon = metadata.is_won === true;
      const metadataLost = metadata.is_lost === true;

      if (metadataWon || (matchesWonValue && metadata.is_won !== false)) {
        won.add(value);
      }

      if (metadataLost || (['lost', 'closed_lost'].includes(value) && metadata.is_lost !== false)) {
        lost.add(value);
      }
    });

    return {
      won: won.size ? Array.from(won) : FALLBACK_WON_STATUSES,
      lost: lost.size ? Array.from(lost) : FALLBACK_LOST_STATUSES
    };
  } catch (error) {
    console.warn('Failed to load lead status segments from picklists:', error);
    return {
      won: FALLBACK_WON_STATUSES,
      lost: FALLBACK_LOST_STATUSES
    };
  }
};

/**
 * Get dashboard statistics with period comparison
 */
const getDashboardStats = async (currentUser) => {
  try {
    // Generate cache key for this user's dashboard stats
    const cacheKey = cache.generateUserKey('dashboard_stats', currentUser, {
      role: currentUser.role
    });

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📋 [CACHE] Returning cached dashboard stats');
      return cached;
    }

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get current and previous period stats
    const result = await getDashboardStatsWithComparison(currentUser, thirtyDaysAgo, sixtyDaysAgo);

    // Cache the result for 5 minutes (300 seconds)
    cache.set(cacheKey, result, 300);

    return result;
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw new ApiError('Failed to fetch dashboard statistics', 500);
  }
};

/**
 * Get dashboard statistics with comparison to previous period
 */
const getDashboardStatsWithComparison = async (currentUser, thirtyDaysAgo, sixtyDaysAgo) => {
  try {
    const supabase = supabaseAdmin;

    // Create separate query builders to avoid conflicts
    const createBaseQuery = () => {
      let query = supabase
        .from('leads')
        .select('id, created_at, status', { count: 'exact' })
        .eq('company_id', currentUser.company_id);

      if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
        query = query.eq('assigned_to', currentUser.id);
      }
      return query;
    };

    const createConvertedQuery = (fromDate, toDate) => {
      const limit = 1000;
      let convertedQuery = supabase
        .from('lead_status_history')
        .select('lead_id, changed_at')
        .eq('company_id', currentUser.company_id)
        .eq('status', 'won')
        .gte('changed_at', fromDate.toISOString())
        .limit(limit);

      if (toDate) {
        convertedQuery = convertedQuery.lt('changed_at', toDate.toISOString());
      }

      if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
        convertedQuery = convertedQuery.eq('changed_by', currentUser.id);
      }

      return convertedQuery;
    };

    const { won: wonStatuses } = await getLeadStatusSegments(currentUser.company_id);
    const emptyResult = { count: 0, error: null };

    const totalPromise = createBaseQuery();
    const currentNewPromise = createBaseQuery().gte('created_at', thirtyDaysAgo.toISOString());
    const previousNewPromise = createBaseQuery()
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const currentConvertedPromise = wonStatuses.length
      ? createConvertedQuery(thirtyDaysAgo, null)
      : Promise.resolve(emptyResult);

    const previousConvertedPromise = wonStatuses.length
      ? createConvertedQuery(sixtyDaysAgo, thirtyDaysAgo)
      : Promise.resolve(emptyResult);

    const [
      totalResult,
      currentNewResult,
      previousNewResult,
      currentConvertedResult,
      previousConvertedResult
    ] = await Promise.all([
      totalPromise,
      currentNewPromise,
      previousNewPromise,
      currentConvertedPromise,
      previousConvertedPromise
    ]);

    if (totalResult.error) throw totalResult.error;
    if (currentNewResult.error) throw currentNewResult.error;
    if (previousNewResult.error) throw previousNewResult.error;
    if (currentConvertedResult.error) throw currentConvertedResult.error;
    if (previousConvertedResult.error) throw previousConvertedResult.error;

    const totalLeadsCount = totalResult.count || 0;
    const currentNewLeadsCount = currentNewResult.count || 0;
    const previousNewLeadsCount = previousNewResult.count || 0;
    const currentConvertedLeadsCount = currentConvertedResult.count || 0;
    const previousConvertedLeadsCount = previousConvertedResult.count || 0;

    // Calculate conversion rate
    const conversionRate = totalLeadsCount > 0 ? (currentConvertedLeadsCount / totalLeadsCount * 100).toFixed(1) : '0.0';

    // Calculate percentage changes
    const newLeadsChange = previousNewLeadsCount > 0
      ? ((currentNewLeadsCount - previousNewLeadsCount) / previousNewLeadsCount * 100).toFixed(1)
      : currentNewLeadsCount > 0 ? '100.0' : '0.0';

    const convertedLeadsChange = previousConvertedLeadsCount > 0
      ? ((currentConvertedLeadsCount - previousConvertedLeadsCount) / previousConvertedLeadsCount * 100).toFixed(1)
      : currentConvertedLeadsCount > 0 ? '100.0' : '0.0';

    // Calculate total leads change (comparing current period vs previous period)
    const previousTotalLeadsCount = totalLeadsCount - currentNewLeadsCount;
    const totalLeadsChangePercent = previousTotalLeadsCount > 0
      ? ((totalLeadsCount - previousTotalLeadsCount) / previousTotalLeadsCount * 100).toFixed(1)
      : totalLeadsCount > 0 ? '100.0' : '0.0';

    // Calculate conversion rate change
    const previousConversionRate = totalLeadsCount > 0 ? (previousConvertedLeadsCount / totalLeadsCount * 100) : 0;
    const conversionRateChange = previousConversionRate > 0
      ? ((parseFloat(conversionRate) - previousConversionRate) / previousConversionRate * 100).toFixed(1)
      : '0.0';

    return {
      total_leads: totalLeadsCount,
      new_leads: currentNewLeadsCount,
      converted_leads: currentConvertedLeadsCount,
      conversion_rate: `${conversionRate}%`,
      // Include percentage changes for frontend
      total_leads_change: `${totalLeadsChangePercent >= 0 ? '+' : ''}${totalLeadsChangePercent}%`,
      new_leads_change: `${newLeadsChange >= 0 ? '+' : ''}${newLeadsChange}%`,
      converted_leads_change: `${convertedLeadsChange >= 0 ? '+' : ''}${convertedLeadsChange}%`,
      conversion_rate_change: `${conversionRateChange >= 0 ? '+' : ''}${conversionRateChange}%`
    };
  } catch (error) {
    console.error('Dashboard stats with comparison error:', error);
    throw new ApiError('Failed to fetch dashboard statistics', 500);
  }
};

/**
 * Fallback dashboard stats function using individual queries
 * Used when the optimized RPC function is not available
 */
const getDashboardStatsFallback = async (currentUser, thirtyDaysAgo) => {
  try {
    const supabase = supabaseAdmin;

    const createBaseQuery = () => {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('company_id', currentUser.company_id);

      if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
        query = query.eq('assigned_to', currentUser.id);
      }

      return query;
    };

    const { won: wonStatuses } = await getLeadStatusSegments(currentUser.company_id);
    const emptyResult = { count: 0, error: null };

    const totalPromise = createBaseQuery();
    const newPromise = createBaseQuery().gte('created_at', thirtyDaysAgo.toISOString());
    const convertedPromise = wonStatuses.length
      ? createBaseQuery().in('status', wonStatuses)
      : Promise.resolve(emptyResult);

    const [totalResult, newResult, convertedResult] = await Promise.all([
      totalPromise,
      newPromise,
      convertedPromise
    ]);

    if (totalResult.error) throw totalResult.error;
    if (newResult.error) throw newResult.error;
    if (convertedResult.error) throw convertedResult.error;

    const totalLeadsCount = totalResult.count || 0;
    const newLeadsCount = newResult.count || 0;
    const convertedLeadsCount = convertedResult.count || 0;

    // Calculate conversion rate
    const conversionRate = totalLeadsCount > 0 ? (convertedLeadsCount / totalLeadsCount * 100).toFixed(1) : '0.0';

    return {
      total_leads: totalLeadsCount,
      new_leads: newLeadsCount,
      converted_leads: convertedLeadsCount,
      conversion_rate: `${conversionRate}%`
    };
  } catch (error) {
    console.error('Dashboard stats fallback error:', error);
    throw new ApiError('Failed to fetch dashboard statistics', 500);
  }
};

/**
 * Get recent leads - Optimized with single query and proper field selection
 */
const getRecentLeads = async (currentUser, limit = 10) => {
  try {
    // Generate cache key for this user's recent leads
    const cacheKey = cache.generateUserKey('recent_leads', currentUser, {
      limit: limit,
      role: currentUser.role
    });

    // Check cache first (shorter TTL for recent leads as they change more frequently)
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📋 [CACHE] Returning cached recent leads');
      return cached;
    }

    const supabase = supabaseAdmin;

    // Build optimized query with specific field selection (no SELECT *)
    let query = supabase
      .from('leads')
      .select(`
        id,
        name,
        email,
        company,
        status,
        lead_source,
        source,
        created_at,
        assigned_to,
        user_profiles!assigned_to(first_name, last_name)
      `)
      .eq('company_id', currentUser.company_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Recent leads error:', error);
      throw error;
    }

    // Format the data efficiently
    const result = data.map(lead => {
      // Split name into first and last for backward compatibility
      const nameParts = (lead.name || '').split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      return {
        id: lead.id,
        first_name,
        last_name,
        name: lead.name || '',
        email: lead.email || '',
        company: lead.company || '',
        status: lead.status || 'new',
        lead_source: lead.lead_source || lead.source || 'unknown',
        created_at: lead.created_at,
        assigned_user_first_name: lead.user_profiles?.first_name || null,
        assigned_user_last_name: lead.user_profiles?.last_name || null
      };
    });

    // Cache the result for 2 minutes (120 seconds)
    cache.set(cacheKey, result, 120);

    return result;
  } catch (error) {
    console.error('Recent leads error:', error);
    throw new ApiError('Failed to fetch recent leads', 500);
  }
};

/**
 * Get lead trends over time
 */
const getLeadTrends = async (currentUser, period = '30d') => {
  try {
    let dateFilter;
    let groupByFormat;

    // Determine date range and grouping format
    switch (period) {
      case '7d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '30d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '90d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 90);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '1y':
        dateFilter = new Date();
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        groupByFormat = 'YYYY-MM';
        break;
      default:
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
        groupByFormat = 'YYYY-MM-DD';
    }

    // Use Supabase RPC for complex date aggregation query
    const supabase = supabaseAdmin;

    const { data: trends, error } = await supabase.rpc('get_lead_trends', {
      p_company_id: currentUser.company_id,
      p_date_filter: dateFilter.toISOString(),
      p_assigned_to: currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin' ? currentUser.id : null
    });

    if (error) {
      console.error('Lead trends RPC error:', error);
      // Fallback to simpler Supabase query if RPC fails
      let query = supabase
        .from('leads')
        .select('created_at')
        .eq('company_id', currentUser.company_id)
        .gte('created_at', dateFilter.toISOString());

      // Non-admin users only see their assigned leads
      if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
        query = query.eq('assigned_to', currentUser.id);
      }

      const { data: leadsData, error: leadsError } = await query;

      if (leadsError) {
        throw leadsError;
      }

      // Group by date in JavaScript since we can't use SQL functions easily
      const groupedData = {};
      leadsData.forEach(lead => {
        const date = new Date(lead.created_at).toISOString().split('T')[0];
        groupedData[date] = (groupedData[date] || 0) + 1;
      });

      // Convert to array format
      const trendsData = Object.keys(groupedData)
        .map(date => ({ date, count: groupedData[date] }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trendsData;
    }

    // Format the data for charts
    return trends.map(trend => ({
      date: trend.date,
      count: parseInt(trend.count)
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch lead trends', 500);
  }
};

/**
 * Get lead source distribution
 */
const getLeadSources = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;
    
    // Build query to get lead source counts
    let query = supabase
      .from('leads')
      .select('lead_source, source')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Lead sources error:', error);
      throw error;
    }

    // Group by source and count
    const sourceCounts = {};
    data.forEach(lead => {
      const source = lead.lead_source || lead.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Convert to array and calculate percentages
    const total = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
    const sources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);

    return sources;
  } catch (error) {
    console.error('Lead sources error:', error);
    throw new ApiError('Failed to fetch lead sources', 500);
  }
};

/**
 * Get lead status distribution
 */
const getLeadStatus = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Build query for lead status counts
    let query = supabase
      .from('leads')
      .select('status')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data: leadsData, error } = await query;

    if (error) {
      throw error;
    }

    // Group by status and count
    const statusCounts = {};
    leadsData.forEach(lead => {
      const status = lead.status || 'new';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Convert to array format and calculate percentages
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const statuses = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);

    return statuses;
  } catch (error) {
    console.error('Lead status error:', error);
    throw new ApiError('Failed to fetch lead status', 500);
  }
};

/**
 * Get user performance metrics (admin only)
 */
const getUserPerformance = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Get all user profiles for the company
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role, is_active')
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true);

    if (usersError) {
      throw usersError;
    }

    // Get email addresses from auth.users via the view
    const { data: userEmails, error: emailError } = await supabase
      .from('user_profiles_limited')
      .select('id, email')
      .eq('company_id', currentUser.company_id);

    if (emailError) {
      console.warn('Could not fetch user emails:', emailError);
    }

    // Create email lookup
    const emailLookup = {};
    if (userEmails) {
      userEmails.forEach(user => {
        emailLookup[user.id] = user.email;
      });
    }

    // Get leads for all users in the company
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('assigned_to, status, created_at')
      .eq('company_id', currentUser.company_id);

    if (leadsError) {
      throw leadsError;
    }

    const { won: wonStatuses } = await getLeadStatusSegments(currentUser.company_id);
    const wonStatusSet = new Set(wonStatuses);

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Group leads by assigned user and calculate metrics
    const userPerformance = users.map(user => {
      const userLeads = leads.filter(lead => lead.assigned_to === user.id);
      const convertedLeads = userLeads.filter(lead => wonStatusSet.has(lead.status));
      const recentLeads = userLeads.filter(lead => new Date(lead.created_at) >= thirtyDaysAgo);

      return {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: emailLookup[user.id] || '',
        role: user.role,
        total_leads: userLeads.length,
        converted_leads: convertedLeads.length,
        recent_leads: recentLeads.length,
        conversion_rate: userLeads.length > 0 ?
          ((convertedLeads.length / userLeads.length) * 100).toFixed(1) : '0.0'
      };
    });

    // Sort by total leads descending
    return userPerformance.sort((a, b) => b.total_leads - a.total_leads);
  } catch (error) {
    console.error('User performance error:', error);
    throw new ApiError('Failed to fetch user performance', 500);
  }
};

/**
 * Get monthly lead trends for the past 12 months
 */
const getMonthlyTrends = async (currentUser) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Use Supabase with JavaScript grouping
    const supabase = supabaseAdmin;

    let query = supabase
      .from('leads')
      .select('created_at')
      .eq('company_id', currentUser.company_id)
      .gte('created_at', twelveMonthsAgo.toISOString());

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data: leadsData, error } = await query;
    if (error) throw error;

    // Group by month in JavaScript
    const groupedData = {};
    leadsData.forEach(lead => {
      const month = new Date(lead.created_at).toISOString().slice(0, 7); // YYYY-MM
      groupedData[month] = (groupedData[month] || 0) + 1;
    });

    const trends = Object.keys(groupedData)
      .map(month => ({ month, count: groupedData[month] }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return trends.map(trend => ({
      month: trend.month.toISOString().substring(0, 7), // YYYY-MM format
      count: parseInt(trend.count)
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch monthly trends', 500);
  }
};

/**
 * Get pipeline stage distribution
 */
const getPipelineStageDistribution = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Get all pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, name, order_position')
      .eq('company_id', currentUser.company_id)
      .order('order_position', { ascending: true });

    if (stagesError) {
      throw stagesError;
    }

    // Get leads data
    let leadsQuery = supabase
      .from('leads')
      .select('pipeline_stage_id, deal_value')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      leadsQuery = leadsQuery.eq('assigned_to', currentUser.id);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      throw leadsError;
    }

    // Calculate metrics for each stage
    const stageMetrics = stages.map(stage => {
      const stageLeads = leads.filter(lead => lead.pipeline_stage_id === stage.id);
      const dealValues = stageLeads.map(lead => parseFloat(lead.deal_value || 0)).filter(val => val > 0);

      const count = stageLeads.length;
      const totalDealValue = dealValues.reduce((sum, val) => sum + val, 0);
      const avgDealValue = dealValues.length > 0 ? totalDealValue / dealValues.length : 0;

      return {
        stage_name: stage.name,
        order_position: stage.order_position,
        count,
        avg_deal_value: avgDealValue,
        total_deal_value: totalDealValue
      };
    });

    // Calculate percentages
    const total = stageMetrics.reduce((sum, stage) => sum + stage.count, 0);

    return stageMetrics.map(stage => ({
      ...stage,
      percentage: total > 0 ? ((stage.count / total) * 100).toFixed(1) : '0.0'
    }));
  } catch (error) {
    console.error('Pipeline stage distribution error:', error);
    throw new ApiError('Failed to fetch pipeline stage distribution', 500);
  }
};

/**
 * Get activity trends over time
 */
const getActivityTrends = async (currentUser, period = '30d') => {
  try {
    let dateFilter;

    // Determine date range
    switch (period) {
      case '7d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const supabase = supabaseAdmin;

    let activitiesQuery = supabase
      .from('activities')
      .select('created_at, activity_type')
      .eq('company_id', currentUser.company_id)
      .gte('created_at', dateFilter.toISOString());

    // Non-admin users only see their activities
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      activitiesQuery = activitiesQuery.eq('user_id', currentUser.id);
    }

    const { data: activities, error } = await activitiesQuery;

    if (error) {
      throw error;
    }

    // Group by date and activity type
    const groupedTrends = {};
    activities.forEach(activity => {
      const date = new Date(activity.created_at).toISOString().split('T')[0];
      if (!groupedTrends[date]) {
        groupedTrends[date] = {};
      }
      if (!groupedTrends[date][activity.activity_type]) {
        groupedTrends[date][activity.activity_type] = 0;
      }
      groupedTrends[date][activity.activity_type]++;
    });

    return groupedTrends;
  } catch (error) {
    console.error('Activity trends error:', error);
    throw new ApiError('Failed to fetch activity trends', 500);
  }
};

/**
 * Get conversion funnel data
 */
const getConversionFunnelData = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Get all pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, name, order_position')
      .eq('company_id', currentUser.company_id)
      .order('order_position', { ascending: true });

    if (stagesError) {
      throw stagesError;
    }

    // Get leads data
    let leadsQuery = supabase
      .from('leads')
      .select('pipeline_stage_id')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      leadsQuery = leadsQuery.eq('assigned_to', currentUser.id);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      throw leadsError;
    }

    // Calculate counts for each stage
    const stageCounts = stages.map(stage => {
      const count = leads.filter(lead => lead.pipeline_stage_id === stage.id).length;
      return {
        stage_name: stage.name,
        order_position: stage.order_position,
        count
      };
    });

    // Calculate conversion rates
    const funnelData = [];
    let previousCount = null;

    stageCounts.forEach(stage => {
      const conversionRate = previousCount && previousCount > 0 ?
        ((stage.count / previousCount) * 100).toFixed(1) : '100.0';

      funnelData.push({
        stage_name: stage.stage_name,
        order_position: stage.order_position,
        count: stage.count,
        conversion_rate: parseFloat(conversionRate)
      });

      previousCount = stage.count;
    });

    return funnelData;
  } catch (error) {
    console.error('Conversion funnel data error:', error);
    throw new ApiError('Failed to fetch conversion funnel data', 500);
  }
};

/**
 * Get response time analytics
 */
const getResponseTimeAnalytics = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Get leads data
    let leadsQuery = supabase
      .from('leads')
      .select('id, created_at')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      leadsQuery = leadsQuery.eq('assigned_to', currentUser.id);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      throw leadsError;
    }

    // Get call activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('lead_id, created_at')
      .eq('company_id', currentUser.company_id)
      .eq('activity_type', 'call');

    if (activitiesError) {
      throw activitiesError;
    }

    // Calculate response times in JavaScript
    let totalResponseTime = 0;
    let responseCount = 0;
    let respondedWithin1h = 0;
    let respondedWithin24h = 0;

    leads.forEach(lead => {
      const leadCreatedAt = new Date(lead.created_at);

      // Find first activity for this lead after it was created
      const firstActivity = activities
        .filter(activity =>
          activity.lead_id === lead.id &&
          new Date(activity.created_at) > leadCreatedAt
        )
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

      if (firstActivity) {
        const responseTimeHours = (new Date(firstActivity.created_at) - leadCreatedAt) / (1000 * 60 * 60);
        totalResponseTime += responseTimeHours;
        responseCount++;

        if (responseTimeHours <= 1) {
          respondedWithin1h++;
        }
        if (responseTimeHours <= 24) {
          respondedWithin24h++;
        }
      }
    });

    const totalLeads = leads.length;
    const avgResponseTimeHours = responseCount > 0 ? totalResponseTime / responseCount : 0;

    return {
      avg_response_time_hours: avgResponseTimeHours,
      responded_within_1h: respondedWithin1h,
      responded_within_24h: respondedWithin24h,
      response_rate_1h: totalLeads > 0 ? ((respondedWithin1h / totalLeads) * 100).toFixed(1) : '0.0',
      response_rate_24h: totalLeads > 0 ? ((respondedWithin24h / totalLeads) * 100).toFixed(1) : '0.0',
      total_leads: totalLeads
    };
  } catch (error) {
    console.error('Response time analytics error:', error);
    throw new ApiError('Failed to fetch response time analytics', 500);
  }
};

/**
 * Get team workload distribution
 */
const getTeamWorkloadDistribution = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Get all user profiles for the company (exclude admins)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role, is_active')
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true)
      .neq('role', 'company_admin');

    if (usersError) {
      throw usersError;
    }

    // Get email addresses from auth.users via the view
    const { data: userEmails, error: emailError } = await supabase
      .from('user_profiles_limited')
      .select('id, email')
      .eq('company_id', currentUser.company_id);

    if (emailError) {
      console.warn('Could not fetch user emails:', emailError);
    }

    // Create email lookup
    const emailLookup = {};
    if (userEmails) {
      userEmails.forEach(user => {
        emailLookup[user.id] = user.email;
      });
    }

    // Get leads for all users in the company
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('assigned_to, pipeline_stage_id')
      .eq('company_id', currentUser.company_id);

    if (leadsError) {
      throw leadsError;
    }

    // Get activities for all users in the company
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('user_id, created_at')
      .eq('company_id', currentUser.company_id);

    if (activitiesError) {
      throw activitiesError;
    }

    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Group data by user and calculate metrics
    const workload = users.map(user => {
      const userLeads = leads.filter(lead => lead.assigned_to === user.id);
      const activeLeads = userLeads.filter(lead => lead.pipeline_stage_id !== null);
      const userActivities = activities.filter(activity => activity.user_id === user.id);
      const recentActivities = userActivities.filter(activity =>
        new Date(activity.created_at) >= sevenDaysAgo
      );

      return {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: emailLookup[user.id] || '',
        total_leads: userLeads.length,
        active_leads: activeLeads.length,
        total_activities: userActivities.length,
        recent_activities: recentActivities.length
      };
    });

    // Sort by total leads descending
    return workload.sort((a, b) => b.total_leads - a.total_leads);
  } catch (error) {
    console.error('Team workload distribution error:', error);
    throw new ApiError('Failed to fetch team workload distribution', 500);
  }
};

/**
 * Get badge counts for sidebar
 */
const getBadgeCounts = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Get new leads count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let leadsQuery = supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('company_id', currentUser.company_id)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      leadsQuery = leadsQuery.eq('assigned_to', currentUser.id);
    }

    const { count: newLeadsCount, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Badge counts - leads error:', leadsError);
    }

    // Get pending activities count (scheduled but not completed)
    let activitiesQuery = supabase
      .from('activities')
      .select('id', { count: 'exact' })
      .eq('company_id', currentUser.company_id)
      .eq('is_completed', false)
      .not('scheduled_at', 'is', null);

    // Non-admin users only see their activities
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      activitiesQuery = activitiesQuery.eq('user_id', currentUser.id);
    }

    const { count: pendingActivitiesCount, error: activitiesError } = await activitiesQuery;

    if (activitiesError) {
      console.error('Badge counts - activities error:', activitiesError);
    }

    // Get pending tasks count
    let tasksQuery = supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('company_id', currentUser.company_id)
      .eq('status', 'pending');

    // Non-admin users only see their assigned tasks
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      tasksQuery = tasksQuery.eq('assigned_to', currentUser.id);
    }

    const { count: pendingTasksCount, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error('Badge counts - tasks error:', tasksError);
    }

    return {
      leads: newLeadsCount || 0,
      activities: pendingActivitiesCount || 0,
      tasks: pendingTasksCount || 0
    };
  } catch (error) {
    console.error('Badge counts error:', error);
    throw new ApiError('Failed to fetch badge counts', 500);
  }
};

module.exports = {
  getDashboardStats,
  getRecentLeads,
  getLeadTrends,
  getLeadSources,
  getLeadStatus,
  getUserPerformance,
  getMonthlyTrends,
  getPipelineStageDistribution,
  getActivityTrends,
  getConversionFunnelData,
  getResponseTimeAnalytics,
  getTeamWorkloadDistribution,
  getBadgeCounts
};
