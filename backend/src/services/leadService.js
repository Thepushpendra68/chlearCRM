const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const configLoader = require('../config/industry/configLoader');

const normalizeEmail = (email) => {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim();
  return trimmed.length === 0 ? null : trimmed.toLowerCase();
};

/**
 * Get all leads with pagination, search, and filtering - Optimized version
 */
const getLeads = async (currentUser, page = 1, limit = 20, filters = {}) => {
  try {
    const offset = (page - 1) * limit;

    // Build optimized query with specific field selection
    let query = supabaseAdmin
      .from('leads')
      .select(`
        id, name, first_name, last_name, email, phone, company, title,
        status, source, deal_value, expected_close_date, notes,
        priority, created_at, updated_at, assigned_at,
        assigned_to, created_by, pipeline_stage_id, custom_fields,
        user_profiles!assigned_to(id, first_name, last_name)
      `)
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    // Apply filters efficiently
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    // Apply date range filters
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply deal value range filters
    if (filters.deal_value_min !== undefined && filters.deal_value_min !== null) {
      query = query.gte('deal_value', filters.deal_value_min);
    }

    if (filters.deal_value_max !== undefined && filters.deal_value_max !== null) {
      query = query.lte('deal_value', filters.deal_value_max);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Get total count and paginated results in parallel for better performance
    let countQuery = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads (for count)
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      countQuery = countQuery.eq('assigned_to', currentUser.id);
    }

    const [countResult, leadsResult] = await Promise.all([
      countQuery,
      // Paginated query
      query.range(offset, offset + limit - 1)
    ]);

    if (countResult.error) {
      console.error('Count error:', countResult.error);
      throw countResult.error;
    }

    if (leadsResult.error) {
      console.error('Leads query error:', leadsResult.error);
      throw leadsResult.error;
    }

    const totalItems = countResult.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Format the data efficiently
    const formattedLeads = leadsResult.data.map(lead => {
      return {
        id: lead.id,
        name: lead.name || '',
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        job_title: lead.title, // Map title to job_title for frontend
        lead_source: lead.source, // Map source to lead_source for frontend
        status: lead.status,
        deal_value: lead.deal_value,
        expected_close_date: lead.expected_close_date,
        notes: lead.notes,
        priority: lead.priority,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        assigned_at: lead.assigned_at,
        assigned_to: lead.assigned_to,
        created_by: lead.created_by,
        pipeline_stage_id: lead.pipeline_stage_id,
        custom_fields: lead.custom_fields || {},
        assigned_user_first_name: lead.user_profiles?.first_name || null,
        assigned_user_last_name: lead.user_profiles?.last_name || null
      };
    });

    return {
      leads: formattedLeads,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Get leads error:', error);
    throw new ApiError('Failed to fetch leads', 500);
  }
};

/**
 * Get lead by ID
 */
const getLeadById = async (id) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Transform database fields to frontend expected format
    if (lead) {
      return {
        ...lead,
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        job_title: lead.title, // Map title to job_title for frontend
        lead_source: lead.source, // Map source to lead_source for frontend
        assigned_user_first_name: lead.user_profiles?.first_name || null,
        assigned_user_last_name: lead.user_profiles?.last_name || null
      };
    }

    return lead;
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    throw new ApiError('Failed to fetch lead', 500);
  }
};

/**
 * Create new lead
 */
const createLead = async (leadData, industryConfig = null) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    // Use injected industry config from middleware, or load as fallback
    if (!industryConfig) {
      console.warn('⚠️ No industry config provided, loading from company');
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('industry_type')
        .eq('id', leadData.company_id)
        .single();

      if (companyError) {
        console.warn('⚠️ Could not load company configuration, using base config');
      }

      industryConfig = configLoader.getConfigForCompany(company);
    }

    // Transform frontend field names to database column names
    const normalizedEmail = normalizeEmail(leadData.email);

    const transformedData = {
      company_id: leadData.company_id,
      first_name: leadData.first_name,
      last_name: leadData.last_name,
      name: `${leadData.first_name} ${leadData.last_name}`.trim(), // Keep for backward compatibility
      email: normalizedEmail,
      phone: leadData.phone,
      company: leadData.company,
      title: leadData.job_title, // Map job_title to title
      source: leadData.lead_source, // Map lead_source to source
      status: leadData.status,
      deal_value: leadData.deal_value,
      expected_close_date: leadData.expected_close_date,
      notes: leadData.notes,
      priority: leadData.priority,
      assigned_to: leadData.assigned_to,
      pipeline_stage_id: leadData.pipeline_stage_id,
      created_by: leadData.created_by
    };

    // Process custom fields if provided
    if (leadData.custom_fields && typeof leadData.custom_fields === 'object') {
      // Validate custom fields against configuration
      const validation = configLoader.validateCustomFields(industryConfig, leadData.custom_fields);

      if (!validation.valid) {
        console.warn('⚠️ Custom field validation warnings:', validation.errors);
        // Log warnings but don't block - allow flexibility
      }

      transformedData.custom_fields = leadData.custom_fields;
    } else {
      transformedData.custom_fields = {};
    }

    // Clean up empty strings for UUID and date fields
    const cleanedData = { ...transformedData };

    // Convert empty strings to null for UUID fields
    if (cleanedData.assigned_to === '') cleanedData.assigned_to = null;
    if (cleanedData.created_by === '') cleanedData.created_by = null;

    // If no pipeline stage is provided, assign the default first stage
    if (!cleanedData.pipeline_stage_id || cleanedData.pipeline_stage_id === '') {
      const { data: defaultStage, error: stageError } = await supabaseAdmin
        .from('pipeline_stages')
        .select('id')
        .eq('company_id', leadData.company_id)
        .eq('is_active', true)
        .order('order_position', { ascending: true })
        .limit(1)
        .single();

      if (stageError) {
        console.error('Error fetching default pipeline stage:', stageError);
        // If no stages exist, create lead without stage (better than failing)
        cleanedData.pipeline_stage_id = null;
      } else {
        cleanedData.pipeline_stage_id = defaultStage.id;
      }
    }

    // Convert empty strings to null for date fields
    if (cleanedData.expected_close_date === '') cleanedData.expected_close_date = null;

    // Convert empty strings to null for numeric fields
    if (cleanedData.deal_value === '' || cleanedData.deal_value === null) cleanedData.deal_value = null;

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        ...cleanedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ApiError('Email already exists', 400);
      }
      throw error;
    }

    return lead;
  } catch (error) {
    console.error('Error creating lead:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create lead', 500);
  }
};

/**
 * Update lead
 */
const updateLead = async (id, leadData, currentUser, industryConfig = null) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    // First, get the existing lead to check permissions
    const { data: existingLead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingLead) {
      return null;
    }

    // Non-admin users can only update leads assigned to them
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin' && existingLead.assigned_to !== currentUser.id) {
      throw new ApiError('Access denied', 403);
    }

    // Use injected industry config from middleware, or load as fallback
    if (!industryConfig) {
      console.warn('⚠️ No industry config provided, loading from company');
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('industry_type')
        .eq('id', existingLead.company_id)
        .single();

      if (companyError) {
        console.warn('⚠️ Could not load company configuration, using base config');
      }

      industryConfig = configLoader.getConfigForCompany(company);
    }

    // Transform frontend field names to database column names
    const transformedData = {};
    if (leadData.first_name !== undefined) transformedData.first_name = leadData.first_name;
    if (leadData.last_name !== undefined) transformedData.last_name = leadData.last_name;
    if (leadData.first_name !== undefined || leadData.last_name !== undefined) {
      // Keep name field for backward compatibility
      transformedData.name = `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim();
    }
    if (leadData.email !== undefined) transformedData.email = normalizeEmail(leadData.email);
    if (leadData.phone !== undefined) transformedData.phone = leadData.phone;
    if (leadData.company !== undefined) transformedData.company = leadData.company;
    if (leadData.job_title !== undefined) transformedData.title = leadData.job_title; // Map job_title to title
    if (leadData.lead_source !== undefined) transformedData.source = leadData.lead_source; // Map lead_source to source
    if (leadData.status !== undefined) transformedData.status = leadData.status;
    if (leadData.deal_value !== undefined) transformedData.deal_value = leadData.deal_value;
    if (leadData.expected_close_date !== undefined) transformedData.expected_close_date = leadData.expected_close_date;
    if (leadData.notes !== undefined) transformedData.notes = leadData.notes;
    if (leadData.priority !== undefined) transformedData.priority = leadData.priority;
    if (leadData.assigned_to !== undefined) transformedData.assigned_to = leadData.assigned_to;
    if (leadData.pipeline_stage_id !== undefined) transformedData.pipeline_stage_id = leadData.pipeline_stage_id;

    // Process custom fields if provided
    if (leadData.custom_fields !== undefined) {
      if (leadData.custom_fields && typeof leadData.custom_fields === 'object') {
        // Validate custom fields against configuration
        const validation = configLoader.validateCustomFields(industryConfig, leadData.custom_fields);

        if (!validation.valid) {
          console.warn('⚠️ Custom field validation warnings:', validation.errors);
          // Log warnings but don't block - allow flexibility
        }

        // Merge with existing custom fields to preserve unmodified fields
        transformedData.custom_fields = {
          ...(existingLead.custom_fields || {}),
          ...leadData.custom_fields
        };
      } else {
        transformedData.custom_fields = {};
      }
    }

    // Clean up empty strings for UUID and date fields
    const cleanedData = { ...transformedData };

    // Convert empty strings to null for UUID fields
    if (cleanedData.assigned_to === '') cleanedData.assigned_to = null;
    if (cleanedData.pipeline_stage_id === '') cleanedData.pipeline_stage_id = null;

    // Convert empty strings to null for date fields
    if (cleanedData.expected_close_date === '') cleanedData.expected_close_date = null;

    // Convert empty strings to null for numeric fields
    if (cleanedData.deal_value === '' || cleanedData.deal_value === null) cleanedData.deal_value = null;

    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        ...cleanedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') { // Unique constraint violation
        throw new ApiError('Email already exists', 400);
      }
      throw updateError;
    }

    return {
      previousLead: existingLead,
      updatedLead
    };
  } catch (error) {
    console.error('Error in updateLead:', error);
    if (error instanceof ApiError) {
      throw error; // Re-throw ApiError as-is
    }
    throw new ApiError('Failed to update lead', 500);
  }
};

/**
 * Delete lead
 */
const deleteLead = async (id, currentUser) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    // Check if lead exists and user has permission
    const { data: existingLead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingLead) {
      return false;
    }

    // Non-admin users can only delete leads assigned to them
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin' && existingLead.assigned_to !== currentUser.id) {
      throw new ApiError('Access denied', 403);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return {
      deleted: true,
      deletedLead: existingLead
    };
  } catch (error) {
    console.error('Error deleting lead:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete lead', 500);
  }
};

/**
 * Get lead statistics
 */
const getLeadStats = async (currentUser) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    // Build query with company filter
    let query = supabaseAdmin
      .from('leads')
      .select('status, source, created_at')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data: leads, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics from the data
    const total_leads = leads.length;

    // Leads by status
    const statusStats = {};
    leads.forEach(lead => {
      const status = lead.status || 'unknown';
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    // Leads by source
    const sourceStats = {};
    leads.forEach(lead => {
      const source = lead.source || 'unknown';
      sourceStats[source] = (sourceStats[source] || 0) + 1;
    });

    // Recent leads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent_leads = leads.filter(lead =>
      new Date(lead.created_at) >= thirtyDaysAgo
    ).length;

    return {
      total_leads,
      recent_leads,
      status_distribution: statusStats,
      source_distribution: sourceStats
    };
  } catch (error) {
    console.error('Error fetching lead statistics:', error);
    throw new ApiError('Failed to fetch lead statistics', 500);
  }
};

/**
 * Get recent leads
 */
const getRecentLeads = async (currentUser, limit = 10) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    let query = supabaseAdmin
      .from('leads')
      .select(`
        id, first_name, last_name, email, company, status, source, created_at,
        user_profiles!assigned_to(first_name, last_name)
      `)
      .eq('company_id', currentUser.company_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data: leads, error } = await query;

    if (error) {
      throw error;
    }

    return leads;
  } catch (error) {
    console.error('Error fetching recent leads:', error);
    throw new ApiError('Failed to fetch recent leads', 500);
  }
};

/**
 * Search leads by query
 */
const searchLeads = async (query, limit = 5, currentUser = null) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    let searchQuery = supabaseAdmin
      .from('leads')
      .select(`
        *,
        user_profiles!assigned_to(first_name, last_name)
      `)
      .or(`name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%,phone.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply company filter if user is provided
    if (currentUser?.company_id) {
      searchQuery = searchQuery.eq('company_id', currentUser.company_id);

      // Non-admin users only see their assigned leads
      if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
        searchQuery = searchQuery.eq('assigned_to', currentUser.id);
      }
    }

    const { data: leads, error } = await searchQuery;

    if (error) {
      throw error;
    }

    return leads;
  } catch (error) {
    console.error('Search leads error:', error);
    throw new ApiError('Failed to search leads', 500);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  getRecentLeads,
  searchLeads
};
