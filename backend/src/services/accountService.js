const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Get all accounts with pagination, search, and filtering
 */
const getAccounts = async (currentUser, page = 1, limit = 20, filters = {}) => {
  try {
    const offset = (page - 1) * limit;

    // Build query with related data
    let query = supabaseAdmin
      .from('accounts')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name),
        parent_account:accounts!parent_account_id(id, name, status)
      `)
      .eq('company_id', currentUser.company_id);

    // Role-based filtering
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    // Apply filters
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},website.ilike.${searchTerm}`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.parent_account_id) {
      query = query.eq('parent_account_id', filters.parent_account_id);
    }

    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }

    // Apply date range filters
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Get count and data in parallel
    let countQuery = supabaseAdmin
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', currentUser.company_id);

    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      countQuery = countQuery.eq('assigned_to', currentUser.id);
    }

    // Apply same filters to count query
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      countQuery = countQuery.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},website.ilike.${searchTerm}`);
    }
    if (filters.status) {
      countQuery = countQuery.eq('status', filters.status);
    }
    if (filters.assigned_to) {
      countQuery = countQuery.eq('assigned_to', filters.assigned_to);
    }
    if (filters.parent_account_id) {
      countQuery = countQuery.eq('parent_account_id', filters.parent_account_id);
    }

    const [countResult, accountsResult] = await Promise.all([
      countQuery,
      query.range(offset, offset + limit - 1)
    ]);

    if (countResult.error) {
      console.error('Count error:', countResult.error);
      throw countResult.error;
    }

    if (accountsResult.error) {
      console.error('Accounts query error:', accountsResult.error);
      throw accountsResult.error;
    }

    const totalItems = countResult.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Format the data
    const formattedAccounts = (accountsResult.data || []).map(account => ({
      ...account,
      assigned_user_first_name: account.user_profiles?.first_name || null,
      assigned_user_last_name: account.user_profiles?.last_name || null,
      parent_account_name: account.parent_account?.name || null,
      user_profiles: undefined, // Remove nested object
      parent_account: undefined // Remove nested object
    }));

    return {
      accounts: formattedAccounts,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Get accounts error:', error);
    throw new ApiError('Failed to fetch accounts', 500);
  }
};

/**
 * Get account by ID
 */
const getAccountById = async (id, currentUser) => {
  try {
    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name),
        parent_account:accounts!parent_account_id(id, name, status, website)
      `)
      .eq('id', id)
      .eq('company_id', currentUser.company_id)
      .single();

    if (error || !account) {
      throw new ApiError('Account not found', 404);
    }

    // Check permissions
    if (currentUser.role !== 'company_admin' && 
        currentUser.role !== 'super_admin' && 
        account.assigned_to !== currentUser.id) {
      throw new ApiError('Access denied', 403);
    }

    // Get child accounts separately (can't use relationship syntax for reverse FK)
    const { data: childAccounts, error: childError } = await supabaseAdmin
      .from('accounts')
      .select('id, name, status, website, industry')
      .eq('parent_account_id', id)
      .eq('company_id', currentUser.company_id);

    if (childError) {
      console.error('Error fetching child accounts:', childError);
    }

    // Format the response
    return {
      ...account,
      assigned_user_first_name: account.user_profiles?.first_name || null,
      assigned_user_last_name: account.user_profiles?.last_name || null,
      parent_account_name: account.parent_account?.name || null,
      child_accounts: childAccounts || [],
      user_profiles: undefined,
      parent_account: undefined
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error fetching account by ID:', error);
    throw new ApiError('Failed to fetch account', 500);
  }
};

/**
 * Create new account
 */
const createAccount = async (accountData, currentUser) => {
  try {
    // Clean and validate data
    const cleanedData = {
      company_id: currentUser.company_id,
      name: accountData.name?.trim(),
      website: accountData.website?.trim() || null,
      industry: accountData.industry?.trim() || null,
      phone: accountData.phone?.trim() || null,
      email: accountData.email?.trim() || null,
      address: accountData.address || {},
      annual_revenue: accountData.annual_revenue || null,
      employee_count: accountData.employee_count || null,
      description: accountData.description?.trim() || null,
      notes: accountData.notes?.trim() || null,
      assigned_to: accountData.assigned_to || null,
      status: accountData.status || 'active',
      custom_fields: accountData.custom_fields || {},
      parent_account_id: accountData.parent_account_id || null,
      created_by: currentUser.id
    };

    // Validate parent account belongs to same company
    if (cleanedData.parent_account_id) {
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('accounts')
        .select('id, company_id')
        .eq('id', cleanedData.parent_account_id)
        .single();

      if (parentError || !parent || parent.company_id !== currentUser.company_id) {
        throw new ApiError('Invalid parent account', 400);
      }

      // Prevent circular references (check if parent is a child of this account)
      // This is a simple check - in a real scenario, you'd want to check the entire hierarchy
      if (cleanedData.parent_account_id === cleanedData.id) {
        throw new ApiError('Account cannot be its own parent', 400);
      }
    }

    // Convert empty strings to null for UUID fields
    if (cleanedData.assigned_to === '') cleanedData.assigned_to = null;
    if (cleanedData.parent_account_id === '') cleanedData.parent_account_id = null;

    // Convert empty strings to null for numeric fields
    if (cleanedData.annual_revenue === '' || cleanedData.annual_revenue === null) {
      cleanedData.annual_revenue = null;
    }
    if (cleanedData.employee_count === '' || cleanedData.employee_count === null) {
      cleanedData.employee_count = null;
    }

    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .insert({
        ...cleanedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ApiError('Account name already exists', 400);
      }
      throw error;
    }

    return account;
  } catch (error) {
    console.error('Error creating account:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create account', 500);
  }
};

/**
 * Update account
 */
const updateAccount = async (id, accountData, currentUser) => {
  try {
    // Check existing account and permissions
    const existingAccount = await getAccountById(id, currentUser);

    const updateData = {};
    if (accountData.name !== undefined) updateData.name = accountData.name?.trim();
    if (accountData.website !== undefined) updateData.website = accountData.website?.trim() || null;
    if (accountData.industry !== undefined) updateData.industry = accountData.industry?.trim() || null;
    if (accountData.phone !== undefined) updateData.phone = accountData.phone?.trim() || null;
    if (accountData.email !== undefined) updateData.email = accountData.email?.trim() || null;
    if (accountData.address !== undefined) updateData.address = accountData.address;
    if (accountData.annual_revenue !== undefined) {
      updateData.annual_revenue = accountData.annual_revenue === '' ? null : accountData.annual_revenue;
    }
    if (accountData.employee_count !== undefined) {
      updateData.employee_count = accountData.employee_count === '' ? null : accountData.employee_count;
    }
    if (accountData.description !== undefined) updateData.description = accountData.description?.trim() || null;
    if (accountData.notes !== undefined) updateData.notes = accountData.notes?.trim() || null;
    if (accountData.assigned_to !== undefined) {
      updateData.assigned_to = accountData.assigned_to === '' ? null : accountData.assigned_to;
    }
    if (accountData.status !== undefined) updateData.status = accountData.status;
    if (accountData.custom_fields !== undefined) updateData.custom_fields = accountData.custom_fields;
    
    if (accountData.parent_account_id !== undefined) {
      updateData.parent_account_id = accountData.parent_account_id === '' ? null : accountData.parent_account_id;
      
      // Validate parent account
      if (updateData.parent_account_id) {
        const { data: parent, error: parentError } = await supabaseAdmin
          .from('accounts')
          .select('id, company_id')
          .eq('id', updateData.parent_account_id)
          .single();

        if (parentError || !parent || parent.company_id !== currentUser.company_id) {
          throw new ApiError('Invalid parent account', 400);
        }

        // Prevent circular references
        if (updateData.parent_account_id === id) {
          throw new ApiError('Account cannot be its own parent', 400);
        }

        // Check if the new parent is a descendant of this account (would create a cycle)
        // Simple check: if parent_account_id is in the child_accounts, it's a cycle
        // For a more robust check, you'd need to traverse the entire tree
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedAccount, error } = await supabaseAdmin
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ApiError('Account name already exists', 400);
      }
      throw error;
    }

    return {
      previousAccount: existingAccount,
      updatedAccount
    };
  } catch (error) {
    console.error('Error updating account:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update account', 500);
  }
};

/**
 * Delete account
 */
const deleteAccount = async (id, currentUser) => {
  try {
    // Check permissions (only admins can delete)
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      throw new ApiError('Access denied. Only administrators can delete accounts.', 403);
    }

    const existingAccount = await getAccountById(id, currentUser);

    // Check if account has child accounts
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('accounts')
      .select('id, name')
      .eq('parent_account_id', id)
      .limit(1);

    if (childrenError) {
      throw childrenError;
    }
    if (children && children.length > 0) {
      throw new ApiError('Cannot delete account with child accounts. Please reassign or delete child accounts first.', 400);
    }

    // Check if account has leads
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('account_id', id)
      .limit(1);

    if (leadsError) {
      throw leadsError;
    }
    if (leads && leads.length > 0) {
      throw new ApiError('Cannot delete account with associated leads. Please reassign leads to another account first.', 400);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('accounts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return {
      deleted: true,
      deletedAccount: existingAccount
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete account', 500);
  }
};

/**
 * Get account leads
 */
const getAccountLeads = async (accountId, currentUser) => {
  try {
    // Verify account exists and user has access
    await getAccountById(accountId, currentUser);

    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name)
      `)
      .eq('account_id', accountId)
      .eq('company_id', currentUser.company_id);

    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data: leads, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format leads similar to leadService
    const formattedLeads = (leads || []).map(lead => ({
      ...lead,
      job_title: lead.title,
      lead_source: lead.source,
      assigned_user_first_name: lead.user_profiles?.first_name || null,
      assigned_user_last_name: lead.user_profiles?.last_name || null,
      user_profiles: undefined
    }));

    return formattedLeads;
  } catch (error) {
    console.error('Error fetching account leads:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch account leads', 500);
  }
};

/**
 * Get account statistics
 */
const getAccountStats = async (accountId, currentUser) => {
  try {
    // Verify account exists and user has access
    await getAccountById(accountId, currentUser);

    // Get leads count
    let leadsQuery = supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('company_id', currentUser.company_id);

    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      leadsQuery = leadsQuery.eq('assigned_to', currentUser.id);
    }

    const { count: leadsCount, error: leadsError } = await leadsQuery;

    if (leadsError) {
      throw leadsError;
    }

    // Get activities count
    const { count: activitiesCount, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('id', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('company_id', currentUser.company_id);

    if (activitiesError) {
      console.error('Error fetching activities count:', activitiesError);
    }

    // Get tasks count
    const { count: tasksCount, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('company_id', currentUser.company_id);

    if (tasksError) {
      console.error('Error fetching tasks count:', tasksError);
    }

    // Get child accounts count
    const { count: childAccountsCount, error: childError } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact' })
      .eq('parent_account_id', accountId)
      .eq('company_id', currentUser.company_id);

    if (childError) {
      console.error('Error fetching child accounts count:', childError);
    }

    return {
      leads_count: leadsCount || 0,
      activities_count: activitiesCount || 0,
      tasks_count: tasksCount || 0,
      child_accounts_count: childAccountsCount || 0
    };
  } catch (error) {
    console.error('Error fetching account stats:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch account statistics', 500);
  }
};

/**
 * Get account timeline (activities, tasks, and audit events)
 */
const getAccountTimeline = async (accountId, currentUser) => {
  try {
    // Verify account exists and user has access
    await getAccountById(accountId, currentUser);

    const timeline = [];

    // Get audit logs for account
    const { data: auditLogs, error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('resource_type', 'account')
      .eq('resource_id', accountId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!auditError && auditLogs) {
      auditLogs.forEach(log => {
        timeline.push({
          id: log.id,
          type: 'audit',
          event_type: log.action,
          title: getAuditEventTitle(log.action),
          description: getAuditEventDescription(log),
          timestamp: log.created_at,
          actor: {
            id: log.actor_id,
            email: log.actor_email,
            role: log.actor_role
          },
          metadata: log.details || {}
        });
      });
    }

    // Get activities for account
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name)
      `)
      .eq('account_id', accountId)
      .eq('company_id', currentUser.company_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!activitiesError && activities) {
      activities.forEach(activity => {
        timeline.push({
          id: activity.id,
          type: 'activity',
          event_type: activity.activity_type,
          title: activity.subject,
          description: activity.description,
          timestamp: activity.created_at,
          is_completed: activity.is_completed,
          scheduled_at: activity.scheduled_at,
          metadata: {
            outcome: activity.outcome,
            duration_minutes: activity.duration_minutes
          }
        });
      });
    }

    // Get tasks for account
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name)
      `)
      .eq('account_id', accountId)
      .eq('company_id', currentUser.company_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!tasksError && tasks) {
      tasks.forEach(task => {
        timeline.push({
          id: task.id,
          type: 'task',
          event_type: task.task_type,
          title: task.title,
          description: task.description,
          timestamp: task.created_at,
          due_date: task.due_date,
          status: task.status,
          priority: task.priority,
          metadata: {}
        });
      });
    }

    // Sort timeline by timestamp (newest first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return timeline;
  } catch (error) {
    console.error('Error fetching account timeline:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch account timeline', 500);
  }
};

/**
 * Helper function to get audit event title
 */
const getAuditEventTitle = (action) => {
  const titles = {
    'account_created': 'Account Created',
    'account_updated': 'Account Updated',
    'account_deleted': 'Account Deleted',
    'account_status_changed': 'Account Status Changed',
    'account_owner_changed': 'Account Owner Changed'
  };
  return titles[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Helper function to get audit event description
 */
const getAuditEventDescription = (log) => {
  if (log.details && typeof log.details === 'object') {
    const details = log.details;
    if (details.resource_name) {
      return `Account: ${details.resource_name}`;
    }
    if (details.status) {
      return `Status changed to: ${details.status}`;
    }
    if (details.assigned_to) {
      return `Assigned to: ${details.assigned_to}`;
    }
  }
  return log.action.replace(/_/g, ' ');
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountLeads,
  getAccountStats,
  getAccountTimeline
};

