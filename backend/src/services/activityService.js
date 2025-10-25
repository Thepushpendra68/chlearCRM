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
          user_profiles!activities_user_id_fkey(first_name, last_name)
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
      const fetchEnd = offset + sanitizedLimit - 1;

      const { data: activities, error } = await query.range(offset, fetchEnd);

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      // Format the data to match expected structure
      const formattedActivities = (activities || []).map(activity => ({
        ...activity,
        company: activity.leads?.company,
        contact_name: activity.leads?.name,
        first_name: activity.user_profiles?.first_name,
        last_name: activity.user_profiles?.last_name,
        // Keep activity_type as is - no mapping needed
        // Remove the nested objects
        leads: undefined,
        user_profiles: undefined
      }));

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
          user_profiles!activities_user_id_fkey(first_name, last_name)
        `)
        .eq('id', activityId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (error || !activity) {
        return { success: false, error: 'Activity not found' };
      }

      // Format the data to match expected structure
      const formattedActivity = {
        ...activity,
        company: activity.leads?.company,
        contact_name: activity.leads?.name,
        first_name: activity.user_profiles?.first_name,
        last_name: activity.user_profiles?.last_name,
        // Keep activity_type as is - no mapping needed
        // Remove the nested objects
        leads: undefined,
        user_profiles: undefined
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

      // Validate required fields
      if (!activityData.lead_id || !activityData.user_id || !activityType) {
        return { success: false, error: 'lead_id, user_id, and activity_type are required' };
      }

      // Validate activity type
      const validTypes = ['call', 'email', 'meeting', 'note', 'task', 'sms', 'stage_change', 'assignment_change'];
      if (!validTypes.includes(activityType)) {
        return { success: false, error: 'Invalid activity type' };
      }

      // Check if lead belongs to user's company
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('company_id')
        .eq('id', activityData.lead_id)
        .eq('company_id', currentUser.company_id)
        .single();

      if (leadError || !lead) {
        return { success: false, error: 'Lead not found or access denied' };
      }

      // Set default values with proper field mapping
      const newActivity = {
        lead_id: activityData.lead_id,
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
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: createdActivity };
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

      // Prepare update data
      const updateFields = {
        subject: updateData.subject,
        description: updateData.description,
        activity_type: updateData.activity_type,
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
          user_profiles!activities_user_id_fkey(first_name, last_name)
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
      const formattedActivity = {
        ...updatedActivity,
        company: updatedActivity.leads?.company,
        contact_name: updatedActivity.leads?.name,
        first_name: updatedActivity.user_profiles?.first_name,
        last_name: updatedActivity.user_profiles?.last_name,
        leads: undefined,
        user_profiles: undefined
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
          user_profiles!activities_user_id_fkey(first_name, last_name)
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
      const formattedActivity = {
        ...updatedActivity,
        company: updatedActivity.leads?.company,
        contact_name: updatedActivity.leads?.name,
        first_name: updatedActivity.user_profiles?.first_name,
        last_name: updatedActivity.user_profiles?.last_name,
        leads: undefined,
        user_profiles: undefined
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
          user_profiles!activities_user_id_fkey(first_name, last_name, email)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching lead timeline:', error);
        return { success: false, error: error.message };
      }

      // Format the response to match expected structure
      const formattedActivities = activities.map(activity => ({
        ...activity,
        first_name: activity.user_profiles?.first_name || '',
        last_name: activity.user_profiles?.last_name || '',
        user_email: activity.user_profiles?.email || '',
        user_profiles: undefined // Remove nested object
      }));

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
      const validTypes = ['call', 'email', 'meeting', 'note', 'task', 'sms', 'stage_change', 'assignment_change'];
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
