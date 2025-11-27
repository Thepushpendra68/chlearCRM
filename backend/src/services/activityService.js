const { supabaseAdmin } = require('../config/supabase');

class ActivityService {
  // Get activities with filters
  async getActivities(currentUser, filters = {}) {
    try {
      const supabase = supabaseAdmin;

      // Build base query
      let query = supabase
        .from('activities')
        .select(`
          *,
          leads!activities_lead_id_fkey(company, name),
          user_profiles!activities_user_id_fkey(first_name, last_name),
          contacts:contacts!activities_contact_id_fkey(id, first_name, last_name, email, phone, mobile_phone)
        `)
        .eq('company_id', currentUser.company_id);

      // Non-admin users only see their own activities
      if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
        query = query.eq('user_id', currentUser.id);
      }

      // Allow admins to request their own feed explicitly
      if (filters.user_specific) {
        query = query.eq('user_id', currentUser.id);
      }

      // Apply filters
      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }

      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.activity_type || filters.type) {
        query = query.eq('activity_type', filters.activity_type || filters.type);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Order by created_at desc by default
      query = query.order('created_at', { ascending: false });

      const requestedLimit = Number.isInteger(filters.limit) ? filters.limit : 20;
      const sanitizedLimit = Math.min(Math.max(requestedLimit, 1), 100);
      const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
      const offset = Number.isInteger(filters.offset)
        ? Math.max(filters.offset, 0)
        : (page - 1) * sanitizedLimit;
      const fetchEnd = offset + sanitizedLimit;

      const { data: activities, error } = await query.range(offset, fetchEnd);

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      // Format the data to match expected structure
      const formattedActivities = (activities || []).map(activity => {
        const contactData = activity.contacts
          ? {
              id: activity.contacts.id,
              first_name: activity.contacts.first_name,
              last_name: activity.contacts.last_name,
              email: activity.contacts.email,
              phone: activity.contacts.phone,
              mobile_phone: activity.contacts.mobile_phone
            }
          : null;

        const contactName = contactData
          ? `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() || contactData.email || null
          : null;

        return {
          ...activity,
          company: activity.leads?.company,
          contact_name: contactName || activity.leads?.name,
          contact: contactData,
          first_name: activity.user_profiles?.first_name,
          last_name: activity.user_profiles?.last_name,
          // Keep activity_type as is - no mapping needed
          // Remove the nested objects
          leads: undefined,
          user_profiles: undefined,
          contacts: undefined
        };
      });

      const hasMore = formattedActivities.length > sanitizedLimit;
      const paginatedActivities = hasMore
        ? formattedActivities.slice(0, sanitizedLimit)
        : formattedActivities;

      return {
        success: true,
        data: paginatedActivities || [],
        pagination: {
          page,
          limit: sanitizedLimit,
          hasMore,
          nextPage: hasMore ? page + 1 : null
        }
      };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: error.message };
    }
  }

  // Get activity by ID
  async getActivityById(activityId, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: activity, error } = await supabase
        .from('activities')
        .select(`
          *,
          leads!activities_lead_id_fkey(company, name),
          user_profiles!activities_user_id_fkey(first_name, last_name),
          contacts:contacts!activities_contact_id_fkey(id, first_name, last_name, email, phone, mobile_phone)
        `)
        .eq('id', activityId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (error || !activity) {
        return { success: false, error: 'Activity not found' };
      }

      // Format the data to match expected structure
      const contactData = activity.contacts
        ? {
            id: activity.contacts.id,
            first_name: activity.contacts.first_name,
            last_name: activity.contacts.last_name,
            email: activity.contacts.email,
            phone: activity.contacts.phone,
            mobile_phone: activity.contacts.mobile_phone
          }
        : null;

      const formattedActivity = {
        ...activity,
        company: activity.leads?.company,
        contact_name: contactData
          ? `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() || contactData.email || null
          : activity.leads?.name,
        contact: contactData,
        first_name: activity.user_profiles?.first_name,
        last_name: activity.user_profiles?.last_name,
        // Keep activity_type as is - no mapping needed
        // Remove the nested objects
        leads: undefined,
        user_profiles: undefined,
        contacts: undefined
      };

      return { success: true, data: formattedActivity };
    } catch (error) {
      console.error('Error fetching activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new activity
  async createActivity(activityData, currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Map activity_type to type for backend compatibility
      const activityType = activityData.activity_type || activityData.type;

      // Validate required fields - either lead_id or account_id is required
      if ((!activityData.lead_id && !activityData.account_id) || !activityData.user_id || !activityType) {
        return { success: false, error: 'Either lead_id or account_id, user_id, and activity_type are required' };
      }

      // Validate activity type
      const validTypes = ['call', 'email', 'meeting', 'note', 'task', 'sms', 'whatsapp', 'stage_change', 'assignment_change'];
      if (!validTypes.includes(activityType)) {
        return { success: false, error: 'Invalid activity type' };
      }

      // Check if lead belongs to user's company (if provided)
      if (activityData.lead_id) {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('company_id')
          .eq('id', activityData.lead_id)
          .eq('company_id', currentUser.company_id)
          .single();

        if (leadError || !lead) {
          return { success: false, error: 'Lead not found or access denied' };
        }
      }

      // Check if account belongs to user's company (if provided)
      if (activityData.account_id) {
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('company_id')
          .eq('id', activityData.account_id)
          .eq('company_id', currentUser.company_id)
          .single();

        if (accountError || !account) {
          return { success: false, error: 'Account not found or access denied' };
        }
      }

      if (activityData.contact_id) {
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('company_id')
          .eq('id', activityData.contact_id)
          .eq('company_id', currentUser.company_id)
          .single();

        if (contactError || !contact) {
          return { success: false, error: 'Contact not found or access denied' };
        }
      }

      // Set default values with proper field mapping
      const newActivity = {
        lead_id: activityData.lead_id || null,
        account_id: activityData.account_id || null,
        contact_id: activityData.contact_id || null,
        user_id: activityData.user_id,
        company_id: currentUser.company_id,
        type: activityType,
        activity_type: activityType,
        subject: activityData.subject || null,
        description: activityData.description || null,
        scheduled_at: activityData.scheduled_at || null,
        completed_at: activityData.completed_at || null,
        is_completed: activityData.is_completed || false,
        duration_minutes: activityData.duration_minutes || null,
        outcome: activityData.outcome || null,
        metadata: activityData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdActivity, error } = await supabase
        .from('activities')
        .insert(newActivity)
        .select(`
          *,
          leads!activities_lead_id_fkey(company, name),
          user_profiles!activities_user_id_fkey(first_name, last_name),
          contacts:contacts!activities_contact_id_fkey(id, first_name, last_name, email, phone, mobile_phone)
        `)
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        return { success: false, error: error.message };
      }

      const createdContactData = createdActivity.contacts
        ? {
            id: createdActivity.contacts.id,
            first_name: createdActivity.contacts.first_name,
            last_name: createdActivity.contacts.last_name,
            email: createdActivity.contacts.email,
            phone: createdActivity.contacts.phone,
            mobile_phone: createdActivity.contacts.mobile_phone
          }
        : null;

      const formattedActivity = {
        ...createdActivity,
        company: createdActivity.leads?.company,
        contact_name: createdContactData
          ? `${createdContactData.first_name || ''} ${createdContactData.last_name || ''}`.trim() || createdContactData.email || null
          : createdActivity.leads?.name,
        contact: createdContactData,
        first_name: createdActivity.user_profiles?.first_name,
        last_name: createdActivity.user_profiles?.last_name,
        leads: undefined,
        user_profiles: undefined,
        contacts: undefined
      };

      return { success: true, data: formattedActivity };
    } catch (error) {
      console.error('Error creating activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Update activity
  async updateActivity(activityId, updateData, currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Check if activity exists and belongs to user's company
      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (fetchError || !existingActivity) {
        return { success: false, error: 'Activity not found' };
      }

      if (updateData.contact_id !== undefined) {
        if (updateData.contact_id === '' || updateData.contact_id === null) {
          existingActivity.contact_id = null; // for fallback usage below
        } else {
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('company_id')
            .eq('id', updateData.contact_id)
            .eq('company_id', currentUser.company_id)
            .single();

          if (contactError || !contact) {
            return { success: false, error: 'Contact not found or access denied' };
          }
        }
      }

      // Prepare update data
      const updateFields = {
        subject: updateData.subject,
        description: updateData.description,
        activity_type: updateData.activity_type,
        lead_id: updateData.lead_id !== undefined ? updateData.lead_id : existingActivity.lead_id,
        account_id: updateData.account_id !== undefined ? updateData.account_id : existingActivity.account_id,
        contact_id: updateData.contact_id !== undefined
          ? (updateData.contact_id === '' ? null : updateData.contact_id)
          : existingActivity.contact_id,
        scheduled_at: updateData.scheduled_at,
        completed_at: updateData.completed_at,
        is_completed: updateData.is_completed,
        duration_minutes: updateData.duration_minutes,
        outcome: updateData.outcome,
        metadata: updateData.metadata,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updateFields).forEach(key => {
        if (updateFields[key] === undefined) {
          delete updateFields[key];
        }
      });

      // Update the activity
      const { data: updatedActivity, error: updateError } = await supabase
        .from('activities')
        .update(updateFields)
        .eq('id', activityId)
        .select(`
          *,
          leads!activities_lead_id_fkey(company, name),
          user_profiles!activities_user_id_fkey(first_name, last_name),
          contacts:contacts!activities_contact_id_fkey(id, first_name, last_name, email, phone, mobile_phone)
        `)
        .single();

      if (updateError) {
        console.error('Error updating activity:', updateError);
        return { success: false, error: `Failed to update activity: ${updateError.message}` };
      }

      // If activity was marked as completed, update lead's last_contact_date
      if (updateData.is_completed && !existingActivity.is_completed &&
          existingActivity.activity_type !== 'note' && existingActivity.lead_id) {
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            last_contact_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingActivity.lead_id);

        if (leadUpdateError) {
          console.error('Error updating lead last_contact_date:', leadUpdateError);
          // Don't fail the entire operation if lead update fails
        }
      }

      // Format the data to match expected structure
      const updatedContactData = updatedActivity.contacts
        ? {
            id: updatedActivity.contacts.id,
            first_name: updatedActivity.contacts.first_name,
            last_name: updatedActivity.contacts.last_name,
            email: updatedActivity.contacts.email,
            phone: updatedActivity.contacts.phone,
            mobile_phone: updatedActivity.contacts.mobile_phone
          }
        : null;

      const formattedActivity = {
        ...updatedActivity,
        company: updatedActivity.leads?.company,
        contact_name: updatedContactData
          ? `${updatedContactData.first_name || ''} ${updatedContactData.last_name || ''}`.trim() || updatedContactData.email || null
          : updatedActivity.leads?.name,
        contact: updatedContactData,
        first_name: updatedActivity.user_profiles?.first_name,
        last_name: updatedActivity.user_profiles?.last_name,
        leads: undefined,
        user_profiles: undefined,
        contacts: undefined
      };

      return {
        success: true,
        data: formattedActivity,
        previousActivity: existingActivity
      };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete activity
  async deleteActivity(activityId, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (fetchError || !existingActivity) {
        return { success: false, error: 'Activity not found or could not be deleted' };
      }

      if (existingActivity.company_id !== currentUser.company_id) {
        return { success: false, error: 'Access denied' };
      }

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        return { success: false, error: 'Activity not found or could not be deleted' };
      }

      return {
        success: true,
        message: 'Activity deleted successfully',
        deletedActivity: existingActivity
      };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark activity as completed
  async completeActivity(activityId, completionData = {}, currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Check if activity exists and belongs to user's company
      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (fetchError || !existingActivity) {
        return { success: false, error: 'Activity not found' };
      }

      const updateData = {
        is_completed: true,
        completed_at: completionData.completed_at || new Date().toISOString(),
        outcome: completionData.outcome || null,
        duration_minutes: completionData.duration_minutes || null,
        updated_at: new Date().toISOString()
      };

      // Update the activity
      const { data: updatedActivity, error: updateError } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', activityId)
        .select(`
          *,
          leads!activities_lead_id_fkey(company, name),
          user_profiles!activities_user_id_fkey(first_name, last_name),
          contacts:contacts!activities_contact_id_fkey(id, first_name, last_name, email, phone, mobile_phone)
        `)
        .single();

      if (updateError) {
        console.error('Error completing activity:', updateError);
        return { success: false, error: `Failed to complete activity: ${updateError.message}` };
      }

      // Update lead's last_contact_date if it's not a note and has a lead
      if (existingActivity.activity_type !== 'note' && existingActivity.lead_id) {
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            last_contact_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingActivity.lead_id);

        if (leadUpdateError) {
          console.error('Error updating lead last_contact_date:', leadUpdateError);
          // Don't fail the entire operation if lead update fails
        }
      }

      // Format the data to match expected structure
      const completedContactData = updatedActivity.contacts
        ? {
            id: updatedActivity.contacts.id,
            first_name: updatedActivity.contacts.first_name,
            last_name: updatedActivity.contacts.last_name,
            email: updatedActivity.contacts.email,
            phone: updatedActivity.contacts.phone,
            mobile_phone: updatedActivity.contacts.mobile_phone
          }
        : null;

      const formattedActivity = {
        ...updatedActivity,
        company: updatedActivity.leads?.company,
        contact_name: completedContactData
          ? `${completedContactData.first_name || ''} ${completedContactData.last_name || ''}`.trim() || completedContactData.email || null
          : updatedActivity.leads?.name,
        contact: completedContactData,
        first_name: updatedActivity.user_profiles?.first_name,
        last_name: updatedActivity.user_profiles?.last_name,
        leads: undefined,
        user_profiles: undefined,
        contacts: undefined
      };

      return {
        success: true,
        data: formattedActivity,
        previousActivity: existingActivity
      };
    } catch (error) {
      console.error('Error completing activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Get lead timeline (all activities for a lead)
  async getLeadTimeline(leadId, limit = 50) {
    try {
      const { data: activities, error } = await supabaseAdmin
        .from('activities')
        .select(`
          *,
          user_profiles!activities_user_id_fkey(first_name, last_name, email),
          contacts:contacts!activities_contact_id_fkey(id, first_name, last_name, email, phone, mobile_phone)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching lead timeline:', error);
        return { success: false, error: error.message };
      }

      // Format the response to match expected structure
      const formattedActivities = (activities || []).map(activity => {
        const contactData = activity.contacts
          ? {
              id: activity.contacts.id,
              first_name: activity.contacts.first_name,
              last_name: activity.contacts.last_name,
              email: activity.contacts.email,
              phone: activity.contacts.phone,
              mobile_phone: activity.contacts.mobile_phone
            }
          : null;

        return {
          ...activity,
          first_name: activity.user_profiles?.first_name || '',
          last_name: activity.user_profiles?.last_name || '',
          user_email: activity.user_profiles?.email || '',
          contact: contactData,
          contact_name: contactData
            ? `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() || contactData.email || null
            : null,
          user_profiles: undefined,
          contacts: undefined
        };
      });

      return { success: true, data: formattedActivities };
    } catch (error) {
      console.error('Error fetching lead timeline:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's activities
  async getUserActivities(userId, filters = {}) {
    try {
      const queryFilters = { ...filters, user_id: userId };
      return await this.getActivities(queryFilters);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return { success: false, error: error.message };
    }
  }

  // Create multiple activities (bulk)
  async createBulkActivities(activitiesData) {
    try {
      const supabase = supabaseAdmin;
      const validTypes = ['call', 'email', 'meeting', 'note', 'task', 'sms', 'whatsapp', 'stage_change', 'assignment_change'];
      const activities = [];

      for (const activityData of activitiesData) {
        // Validate required fields
        if (!activityData.lead_id || !activityData.user_id || !activityData.activity_type) {
          throw new Error('Each activity must have lead_id, user_id, and activity_type');
        }

        if (!validTypes.includes(activityData.activity_type)) {
          throw new Error(`Invalid activity type: ${activityData.activity_type}`);
        }

        activities.push({
          lead_id: activityData.lead_id,
          account_id: activityData.account_id || null,
          contact_id: activityData.contact_id || null,
          user_id: activityData.user_id,
          company_id: activityData.company_id,
          type: activityData.activity_type,
          activity_type: activityData.activity_type,
          subject: activityData.subject || null,
          description: activityData.description || null,
          scheduled_at: activityData.scheduled_at || null,
          completed_at: activityData.completed_at || null,
          is_completed: activityData.is_completed || false,
          duration_minutes: activityData.duration_minutes || null,
          outcome: activityData.outcome || null,
          metadata: activityData.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Insert activities in bulk
      const { data: insertedActivities, error: insertError } = await supabase
        .from('activities')
        .insert(activities)
        .select('id');

      if (insertError) {
        throw new Error(`Failed to create activities: ${insertError.message}`);
      }

      // Update last_contact_date for leads with completed activities
      const completedLeadIds = activities
        .filter(a => a.is_completed && a.activity_type !== 'note')
        .map(a => a.lead_id);

      if (completedLeadIds.length > 0) {
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            last_contact_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', completedLeadIds);

        if (leadUpdateError) {
          console.error('Error updating lead last_contact_date for bulk activities:', leadUpdateError);
          // Don't fail the entire operation if lead update fails
        }
      }

      return {
        success: true,
        data: {
          created_count: insertedActivities.length,
          activity_ids: insertedActivities.map(a => a.id)
        }
      };
    } catch (error) {
      console.error('Error creating bulk activities:', error);
      return { success: false, error: error.message };
    }
  }

  // Get activity statistics
  async getActivityStats(filters = {}) {
    try {
      // Get activities with filters
      let query = supabaseAdmin
        .from('activities')
        .select('activity_type, is_completed, duration_minutes');

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }

      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data: activities, error } = await query;

      if (error) {
        console.error('Error fetching activities for stats:', error);
        return { success: false, error: error.message };
      }

      // Calculate statistics
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.is_completed).length;
      const calls = activities.filter(a => a.activity_type === 'call').length;
      const emails = activities.filter(a => a.activity_type === 'email').length;
      const meetings = activities.filter(a => a.activity_type === 'meeting').length;
      const notes = activities.filter(a => a.activity_type === 'note').length;

      const durations = activities.filter(a => a.duration_minutes).map(a => a.duration_minutes);
      const avgDuration = durations.length > 0 ? durations.reduce((sum, dur) => sum + dur, 0) / durations.length : 0;

      const stats = {
        total_activities: totalActivities,
        completed_activities: completedActivities,
        calls,
        emails,
        meetings,
        notes,
        avg_duration: Math.round(avgDuration * 100) / 100
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ActivityService();
