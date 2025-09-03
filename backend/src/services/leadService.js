const knex = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Get all leads with pagination, search, and filtering
 */
const getLeads = async (page = 1, limit = 20, filters = {}) => {
  try {
    const offset = (page - 1) * limit;
    
    let query = knex('leads')
      .leftJoin('users', 'leads.assigned_to', 'users.id')
      .select(
        'leads.*',
        'users.first_name as assigned_user_first_name',
        'users.last_name as assigned_user_last_name',
        'users.email as assigned_user_email'
      );

    // Apply filters
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(function() {
        this.where('leads.first_name', 'ilike', searchTerm)
          .orWhere('leads.last_name', 'ilike', searchTerm)
          .orWhere('leads.email', 'ilike', searchTerm)
          .orWhere('leads.company', 'ilike', searchTerm)
          .orWhere('leads.phone', 'ilike', searchTerm);
      });
    }

    if (filters.status) {
      query = query.where('leads.status', filters.status);
    }

    if (filters.source) {
      query = query.where('leads.lead_source', filters.source);
    }

    if (filters.assigned_to) {
      query = query.where('leads.assigned_to', filters.assigned_to);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.orderBy(`leads.${sortBy}`, sortOrder);

    // Get total count for pagination
    const countQuery = query.clone().clearSelect().clearOrder().count('* as count');
    const [{ count }] = await countQuery;
    const totalItems = parseInt(count);
    const totalPages = Math.ceil(totalItems / limit);

    // Apply pagination
    const leads = await query.limit(limit).offset(offset);

    return {
      leads,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  } catch (error) {
    throw new ApiError('Failed to fetch leads', 500);
  }
};

/**
 * Get lead by ID
 */
const getLeadById = async (id) => {
  try {
    const lead = await knex('leads')
      .leftJoin('users', 'leads.assigned_to', 'users.id')
      .select(
        'leads.*',
        'users.first_name as assigned_user_first_name',
        'users.last_name as assigned_user_last_name',
        'users.email as assigned_user_email'
      )
      .where('leads.id', id)
      .first();

    return lead;
  } catch (error) {
    throw new ApiError('Failed to fetch lead', 500);
  }
};

/**
 * Create new lead
 */
const createLead = async (leadData) => {
  try {
    // Clean up empty strings for UUID and date fields
    const cleanedData = { ...leadData };
    
    // Convert empty strings to null for UUID fields
    if (cleanedData.assigned_to === '') cleanedData.assigned_to = null;
    if (cleanedData.pipeline_stage_id === '') cleanedData.pipeline_stage_id = null;
    if (cleanedData.created_by === '') cleanedData.created_by = null;
    
    // Convert empty strings to null for date fields
    if (cleanedData.expected_close_date === '') cleanedData.expected_close_date = null;
    
    // Convert empty strings to null for numeric fields
    if (cleanedData.deal_value === '' || cleanedData.deal_value === null) cleanedData.deal_value = null;

    const [lead] = await knex('leads')
      .insert({
        ...cleanedData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    // Return the created lead directly
    return lead;
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new ApiError('Email already exists', 400);
    }
    throw new ApiError('Failed to create lead', 500);
  }
};

/**
 * Update lead
 */
const updateLead = async (id, leadData, currentUser) => {
  try {
    // Check if lead exists and user has permission
    const existingLead = await knex('leads').where('id', id).first();
    if (!existingLead) {
      return null;
    }

    // Non-admin users can only update leads assigned to them
    if (currentUser.role !== 'admin' && existingLead.assigned_to !== currentUser.id) {
      throw new ApiError('Access denied', 403);
    }

    // Clean up empty strings for UUID and date fields
    const cleanedData = { ...leadData };
    
    // Convert empty strings to null for UUID fields
    if (cleanedData.assigned_to === '') cleanedData.assigned_to = null;
    if (cleanedData.pipeline_stage_id === '') cleanedData.pipeline_stage_id = null;
    if (cleanedData.created_by === '') cleanedData.created_by = null;
    
    // Convert empty strings to null for date fields
    if (cleanedData.expected_close_date === '') cleanedData.expected_close_date = null;
    
    // Convert empty strings to null for numeric fields
    if (cleanedData.deal_value === '' || cleanedData.deal_value === null) cleanedData.deal_value = null;

    const [updatedLead] = await knex('leads')
      .where('id', id)
      .update({
        ...cleanedData,
        updated_at: new Date()
      })
      .returning('*');

    // Fetch the complete lead with assigned user info
    const completeLead = await getLeadById(id);
    return completeLead;
  } catch (error) {
    console.error('Error in updateLead:', error);
    if (error.code === '23505') { // Unique constraint violation
      throw new ApiError('Email already exists', 400);
    }
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
    // Check if lead exists and user has permission
    const existingLead = await knex('leads').where('id', id).first();
    if (!existingLead) {
      return false;
    }

    // Non-admin users can only delete leads assigned to them
    if (currentUser.role !== 'admin' && existingLead.assigned_to !== currentUser.id) {
      throw new ApiError('Access denied', 403);
    }

    const deleted = await knex('leads').where('id', id).del();
    return deleted > 0;
  } catch (error) {
    throw new ApiError('Failed to delete lead', 500);
  }
};

/**
 * Get lead statistics
 */
const getLeadStats = async (currentUser) => {
  try {
    let baseQuery = knex('leads');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      baseQuery = baseQuery.where('assigned_to', currentUser.id);
    }

    // Total leads
    const [{ total_leads }] = await baseQuery.clone().count('* as total_leads');

    // Leads by status
    const statusStats = await baseQuery.clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    // Leads by source
    const sourceStats = await baseQuery.clone()
      .select('lead_source')
      .count('* as count')
      .groupBy('lead_source');

    // Recent leads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [{ recent_leads }] = await baseQuery.clone()
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as recent_leads');

    // Convert status and source stats to objects
    const statusDistribution = {};
    statusStats.forEach(stat => {
      statusDistribution[stat.status] = parseInt(stat.count);
    });

    const sourceDistribution = {};
    sourceStats.forEach(stat => {
      sourceDistribution[stat.lead_source] = parseInt(stat.count);
    });

    return {
      total_leads: parseInt(total_leads),
      recent_leads: parseInt(recent_leads),
      status_distribution: statusDistribution,
      source_distribution: sourceDistribution
    };
  } catch (error) {
    throw new ApiError('Failed to fetch lead statistics', 500);
  }
};

/**
 * Get recent leads
 */
const getRecentLeads = async (currentUser, limit = 10) => {
  try {
    let query = knex('leads')
      .leftJoin('users', 'leads.assigned_to', 'users.id')
      .select(
        'leads.id',
        'leads.first_name',
        'leads.last_name',
        'leads.email',
        'leads.company',
        'leads.status',
        'leads.lead_source',
        'leads.created_at',
        'users.first_name as assigned_user_first_name',
        'users.last_name as assigned_user_last_name'
      )
      .orderBy('leads.created_at', 'desc')
      .limit(limit);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('leads.assigned_to', currentUser.id);
    }

    return await query;
  } catch (error) {
    throw new ApiError('Failed to fetch recent leads', 500);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  getRecentLeads
};
