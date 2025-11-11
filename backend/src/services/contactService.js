const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Get all contacts with pagination, search, and filtering
 */
const getContacts = async (currentUser, page = 1, limit = 20, filters = {}) => {
  try {
    const offset = (page - 1) * limit;

    // Build query with related data
    let query = supabaseAdmin
      .from('contacts')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name),
        account:accounts!account_id(id, name, status, industry)
      `)
      .eq('company_id', currentUser.company_id);

    // Role-based filtering
    if (currentUser.role === 'sales_rep') {
      // Sales reps see only their assigned contacts or contacts from their assigned accounts/leads
      query = query.or(`assigned_to.eq.${currentUser.id},account_id.in.(${
        // This is simplified; in production, you'd fetch assigned account IDs first
        'SELECT id FROM accounts WHERE assigned_to = ' + currentUser.id
      })`);
    }

    // Apply filters
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},title.ilike.${searchTerm}`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.account_id) {
      query = query.eq('account_id', filters.account_id);
    }

    if (filters.lifecycle_stage) {
      query = query.eq('lifecycle_stage', filters.lifecycle_stage);
    }

    if (filters.is_decision_maker !== undefined) {
      query = query.eq('is_decision_maker', filters.is_decision_maker);
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
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', currentUser.company_id);

    // Apply same filters to count query
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      countQuery = countQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},title.ilike.${searchTerm}`);
    }
    if (filters.status) {
      countQuery = countQuery.eq('status', filters.status);
    }
    if (filters.assigned_to) {
      countQuery = countQuery.eq('assigned_to', filters.assigned_to);
    }
    if (filters.account_id) {
      countQuery = countQuery.eq('account_id', filters.account_id);
    }

    const [countResult, contactsResult] = await Promise.all([
      countQuery,
      query.range(offset, offset + limit - 1)
    ]);

    if (countResult.error) {
      console.error('Count error:', countResult.error);
      throw countResult.error;
    }

    if (contactsResult.error) {
      console.error('Contacts query error:', contactsResult.error);
      throw contactsResult.error;
    }

    const totalItems = countResult.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Format the data
    const formattedContacts = (contactsResult.data || []).map(contact => ({
      ...contact,
      full_name: `${contact.first_name} ${contact.last_name}`.trim(),
      assigned_user_first_name: contact.user_profiles?.first_name || null,
      assigned_user_last_name: contact.user_profiles?.last_name || null,
      account_name: contact.account?.name || null,
      account_industry: contact.account?.industry || null,
      user_profiles: undefined, // Remove nested object
      account: undefined // Remove nested object
    }));

    return {
      contacts: formattedContacts,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Get contacts error:', error);
    throw new ApiError('Failed to fetch contacts', 500);
  }
};

/**
 * Get contact by ID with full details
 */
const getContactById = async (id, currentUser) => {
  try {
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select(`
        *,
        user_profiles!assigned_to(id, first_name, last_name),
        account:accounts!account_id(id, name, status, website, industry),
        reporting_to_contact:contacts!reporting_to(id, first_name, last_name, email, title)
      `)
      .eq('id', id)
      .eq('company_id', currentUser.company_id)
      .single();

    if (error || !contact) {
      throw new ApiError('Contact not found', 404);
    }

    // Check permissions for sales reps
    if (currentUser.role === 'sales_rep') {
      const hasAccess = contact.assigned_to === currentUser.id ||
        (contact.account_id && await checkAccountAccess(contact.account_id, currentUser.id));
      
      if (!hasAccess) {
        throw new ApiError('Access denied', 403);
      }
    }

    // Get associated leads
    const { data: leadRelations, error: leadsError } = await supabaseAdmin
      .from('lead_contacts')
      .select(`
        id,
        is_primary,
        role,
        lead:leads!lead_id(id, first_name, last_name, email, status, company)
      `)
      .eq('contact_id', id)
      .eq('company_id', currentUser.company_id);

    if (leadsError) {
      console.error('Error fetching lead relations:', leadsError);
    }

    // Get recent activities
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('id, type, description, created_at, user_id')
      .eq('contact_id', id)
      .eq('company_id', currentUser.company_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    }

    // Get tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('contact_id', id)
      .eq('company_id', currentUser.company_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    }

    // Format the response
    return {
      ...contact,
      full_name: `${contact.first_name} ${contact.last_name}`.trim(),
      assigned_user_first_name: contact.user_profiles?.first_name || null,
      assigned_user_last_name: contact.user_profiles?.last_name || null,
      account_name: contact.account?.name || null,
      reporting_to_name: contact.reporting_to_contact ? 
        `${contact.reporting_to_contact.first_name} ${contact.reporting_to_contact.last_name}` : null,
      leads: (leadRelations || []).map(lr => ({
        ...lr.lead,
        relationship_id: lr.id,
        is_primary: lr.is_primary,
        role: lr.role
      })),
      recent_activities: activities || [],
      tasks: tasks || [],
      user_profiles: undefined,
      account: undefined,
      reporting_to_contact: undefined
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error fetching contact by ID:', error);
    throw new ApiError('Failed to fetch contact', 500);
  }
};

/**
 * Helper to check if user has access to account
 */
const checkAccountAccess = async (accountId, userId) => {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .eq('assigned_to', userId)
    .single();

  return !error && !!data;
};

/**
 * Create new contact
 */
const createContact = async (contactData, currentUser) => {
  try {
    // Clean and validate data
    const cleanedData = {
      company_id: currentUser.company_id,
      first_name: contactData.first_name?.trim(),
      last_name: contactData.last_name?.trim(),
      email: contactData.email?.trim()?.toLowerCase() || null,
      phone: contactData.phone?.trim() || null,
      mobile_phone: contactData.mobile_phone?.trim() || null,
      title: contactData.title?.trim() || null,
      department: contactData.department?.trim() || null,
      linkedin_url: contactData.linkedin_url?.trim() || null,
      twitter_handle: contactData.twitter_handle?.trim() || null,
      preferred_contact_method: contactData.preferred_contact_method || null,
      do_not_call: contactData.do_not_call || false,
      do_not_email: contactData.do_not_email || false,
      address: contactData.address || {},
      is_primary: contactData.is_primary || false,
      is_decision_maker: contactData.is_decision_maker || false,
      reporting_to: contactData.reporting_to || null,
      notes: contactData.notes?.trim() || null,
      description: contactData.description?.trim() || null,
      status: contactData.status || 'active',
      lifecycle_stage: contactData.lifecycle_stage || null,
      assigned_to: contactData.assigned_to || currentUser.id,
      account_id: contactData.account_id || null,
      custom_fields: contactData.custom_fields || {},
      created_by: currentUser.id
    };

    // Validate account belongs to same company if provided
    if (cleanedData.account_id) {
      const { data: account, error: accountError } = await supabaseAdmin
        .from('accounts')
        .select('id, company_id')
        .eq('id', cleanedData.account_id)
        .single();

      if (accountError || !account || account.company_id !== currentUser.company_id) {
        throw new ApiError('Invalid account', 400);
      }
    }

    // Check for duplicate email in company
    if (cleanedData.email) {
      const { data: duplicate } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('company_id', currentUser.company_id)
        .eq('email', cleanedData.email)
        .limit(1)
        .single();

      if (duplicate) {
        throw new ApiError(
          `A contact with email "${cleanedData.email}" already exists: ${duplicate.first_name} ${duplicate.last_name}`,
          409
        );
      }
    }

    // Convert empty strings to null for UUID fields
    if (cleanedData.assigned_to === '') cleanedData.assigned_to = null;
    if (cleanedData.account_id === '') cleanedData.account_id = null;
    if (cleanedData.reporting_to === '') cleanedData.reporting_to = null;

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        ...cleanedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ApiError('Contact with this email already exists', 400);
      }
      if (error.code === '23514') { // Check constraint violation
        throw new ApiError('At least one contact method (email, phone, or mobile phone) is required', 400);
      }
      throw error;
    }

    return contact;
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create contact', 500);
  }
};

/**
 * Update contact
 */
const updateContact = async (id, contactData, currentUser) => {
  try {
    // Check existing contact and permissions
    const existingContact = await getContactById(id, currentUser);

    const updateData = {};
    if (contactData.first_name !== undefined) updateData.first_name = contactData.first_name?.trim();
    if (contactData.last_name !== undefined) updateData.last_name = contactData.last_name?.trim();
    if (contactData.email !== undefined) updateData.email = contactData.email?.trim()?.toLowerCase() || null;
    if (contactData.phone !== undefined) updateData.phone = contactData.phone?.trim() || null;
    if (contactData.mobile_phone !== undefined) updateData.mobile_phone = contactData.mobile_phone?.trim() || null;
    if (contactData.title !== undefined) updateData.title = contactData.title?.trim() || null;
    if (contactData.department !== undefined) updateData.department = contactData.department?.trim() || null;
    if (contactData.linkedin_url !== undefined) updateData.linkedin_url = contactData.linkedin_url?.trim() || null;
    if (contactData.twitter_handle !== undefined) updateData.twitter_handle = contactData.twitter_handle?.trim() || null;
    if (contactData.preferred_contact_method !== undefined) updateData.preferred_contact_method = contactData.preferred_contact_method;
    if (contactData.do_not_call !== undefined) updateData.do_not_call = contactData.do_not_call;
    if (contactData.do_not_email !== undefined) updateData.do_not_email = contactData.do_not_email;
    if (contactData.address !== undefined) updateData.address = contactData.address;
    if (contactData.is_primary !== undefined) updateData.is_primary = contactData.is_primary;
    if (contactData.is_decision_maker !== undefined) updateData.is_decision_maker = contactData.is_decision_maker;
    if (contactData.reporting_to !== undefined) {
      updateData.reporting_to = contactData.reporting_to === '' ? null : contactData.reporting_to;
    }
    if (contactData.notes !== undefined) updateData.notes = contactData.notes?.trim() || null;
    if (contactData.description !== undefined) updateData.description = contactData.description?.trim() || null;
    if (contactData.status !== undefined) updateData.status = contactData.status;
    if (contactData.lifecycle_stage !== undefined) updateData.lifecycle_stage = contactData.lifecycle_stage;
    if (contactData.assigned_to !== undefined) {
      updateData.assigned_to = contactData.assigned_to === '' ? null : contactData.assigned_to;
    }
    if (contactData.account_id !== undefined) {
      updateData.account_id = contactData.account_id === '' ? null : contactData.account_id;
      
      // Validate account
      if (updateData.account_id) {
        const { data: account, error: accountError } = await supabaseAdmin
          .from('accounts')
          .select('id, company_id')
          .eq('id', updateData.account_id)
          .single();

        if (accountError || !account || account.company_id !== currentUser.company_id) {
          throw new ApiError('Invalid account', 400);
        }
      }
    }
    if (contactData.custom_fields !== undefined) updateData.custom_fields = contactData.custom_fields;

    // Check for duplicate email if email is being changed
    if (updateData.email && updateData.email !== existingContact.email) {
      const { data: duplicate } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('company_id', currentUser.company_id)
        .eq('email', updateData.email)
        .neq('id', id)
        .limit(1)
        .single();

      if (duplicate) {
        throw new ApiError(
          `A contact with email "${updateData.email}" already exists: ${duplicate.first_name} ${duplicate.last_name}`,
          409
        );
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedContact, error } = await supabaseAdmin
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError('Contact with this email already exists', 400);
      }
      if (error.code === '23514') {
        throw new ApiError('At least one contact method (email, phone, or mobile phone) is required', 400);
      }
      throw error;
    }

    return {
      previousContact: existingContact,
      updatedContact
    };
  } catch (error) {
    console.error('Error updating contact:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update contact', 500);
  }
};

/**
 * Delete contact
 */
const deleteContact = async (id, currentUser) => {
  try {
    // Check permissions (only admins can delete)
    if (currentUser.role !== 'company_admin' && 
        currentUser.role !== 'super_admin' &&
        currentUser.role !== 'manager') {
      throw new ApiError('Access denied. Only administrators and managers can delete contacts.', 403);
    }

    const existingContact = await getContactById(id, currentUser);

    // Check if contact has associated lead relationships
    const { data: leadRelations, error: relationsError } = await supabaseAdmin
      .from('lead_contacts')
      .select('id')
      .eq('contact_id', id)
      .limit(1);

    if (relationsError) {
      throw relationsError;
    }

    if (leadRelations && leadRelations.length > 0) {
      throw new ApiError(
        'Cannot delete contact with associated leads. Please remove lead associations first.',
        400
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return { deletedContact: existingContact };
  } catch (error) {
    console.error('Error deleting contact:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete contact', 500);
  }
};

/**
 * Link contact to lead
 */
const linkContactToLead = async (contactId, leadId, currentUser, options = {}) => {
  try {
    // Verify contact and lead belong to same company
    const [contact, lead] = await Promise.all([
      getContactById(contactId, currentUser),
      supabaseAdmin
        .from('leads')
        .select('id, company_id')
        .eq('id', leadId)
        .eq('company_id', currentUser.company_id)
        .single()
    ]);

    if (!lead.data) {
      throw new ApiError('Lead not found', 404);
    }

    // Check if relationship already exists
    const { data: existing } = await supabaseAdmin
      .from('lead_contacts')
      .select('id')
      .eq('lead_id', leadId)
      .eq('contact_id', contactId)
      .single();

    if (existing) {
      throw new ApiError('Contact is already linked to this lead', 409);
    }

    const { data: relationship, error } = await supabaseAdmin
      .from('lead_contacts')
      .insert({
        lead_id: leadId,
        contact_id: contactId,
        company_id: currentUser.company_id,
        is_primary: options.is_primary || false,
        role: options.role || null,
        created_by: currentUser.id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return relationship;
  } catch (error) {
    console.error('Error linking contact to lead:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to link contact to lead', 500);
  }
};

/**
 * Unlink contact from lead
 */
const unlinkContactFromLead = async (contactId, leadId, currentUser) => {
  try {
    const { error } = await supabaseAdmin
      .from('lead_contacts')
      .delete()
      .eq('lead_id', leadId)
      .eq('contact_id', contactId)
      .eq('company_id', currentUser.company_id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error unlinking contact from lead:', error);
    throw new ApiError('Failed to unlink contact from lead', 500);
  }
};

/**
 * Find duplicate contacts
 */
const findDuplicates = async (searchCriteria, currentUser) => {
  try {
    const duplicates = [];

    // Search by email
    if (searchCriteria.email) {
      const { data: emailMatches } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name, email, phone, title, account_id')
        .eq('company_id', currentUser.company_id)
        .eq('email', searchCriteria.email.trim().toLowerCase())
        .limit(10);

      if (emailMatches && emailMatches.length > 0) {
        duplicates.push(...emailMatches.map(c => ({ ...c, match_type: 'email' })));
      }
    }

    // Search by phone
    if (searchCriteria.phone) {
      const { data: phoneMatches } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name, email, phone, title, account_id')
        .eq('company_id', currentUser.company_id)
        .or(`phone.eq.${searchCriteria.phone},mobile_phone.eq.${searchCriteria.phone}`)
        .limit(10);

      if (phoneMatches && phoneMatches.length > 0) {
        duplicates.push(...phoneMatches.map(c => ({ ...c, match_type: 'phone' })));
      }
    }

    // Search by name
    if (searchCriteria.first_name && searchCriteria.last_name) {
      const { data: nameMatches } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name, email, phone, title, account_id')
        .eq('company_id', currentUser.company_id)
        .ilike('first_name', searchCriteria.first_name.trim())
        .ilike('last_name', searchCriteria.last_name.trim())
        .limit(10);

      if (nameMatches && nameMatches.length > 0) {
        duplicates.push(...nameMatches.map(c => ({ ...c, match_type: 'name' })));
      }
    }

    // Remove duplicates from results array
    const uniqueDuplicates = Array.from(
      new Map(duplicates.map(item => [item.id, item])).values()
    );

    return {
      found: uniqueDuplicates.length > 0,
      duplicates: uniqueDuplicates,
      count: uniqueDuplicates.length
    };
  } catch (error) {
    console.error('Error finding duplicates:', error);
    throw new ApiError('Failed to find duplicates', 500);
  }
};

/**
 * Get contact statistics
 */
const getContactStats = async (currentUser) => {
  try {
    let query = supabaseAdmin
      .from('contacts')
      .select('status, lifecycle_stage, is_decision_maker', { count: 'exact' })
      .eq('company_id', currentUser.company_id);

    if (currentUser.role === 'sales_rep') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data: contacts, count, error } = await query;

    if (error) throw error;

    const stats = {
      total: count || 0,
      by_status: {},
      by_lifecycle_stage: {},
      decision_makers: 0
    };

    contacts?.forEach(contact => {
      // Count by status
      stats.by_status[contact.status] = (stats.by_status[contact.status] || 0) + 1;
      
      // Count by lifecycle stage
      if (contact.lifecycle_stage) {
        stats.by_lifecycle_stage[contact.lifecycle_stage] = 
          (stats.by_lifecycle_stage[contact.lifecycle_stage] || 0) + 1;
      }
      
      // Count decision makers
      if (contact.is_decision_maker) {
        stats.decision_makers++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting contact stats:', error);
    throw new ApiError('Failed to get contact statistics', 500);
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  linkContactToLead,
  unlinkContactFromLead,
  findDuplicates,
  getContactStats
};

