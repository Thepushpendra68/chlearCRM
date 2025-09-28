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

      // Apply filters
      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Order by created_at desc by default
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: activities, error } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      // Format the data to match expected structure
      const formattedActivities = activities.map(activity => ({
        ...activity,
        company: activity.leads?.company,
        contact_name: activity.leads?.name,
        first_name: activity.user_profiles?.first_name,
        last_name: activity.user_profiles?.last_name,
        // Remove the nested objects
        leads: undefined,
        user_profiles: undefined
      }));

      return { success: true, data: formattedActivities || [] };
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

      // Validate required fields
      if (!activityData.lead_id || !activityData.user_id || !activityData.type) {
        return { success: false, error: 'lead_id, user_id, and type are required' };
      }

      // Validate activity type
      const validTypes = ['call', 'email', 'meeting', 'note', 'task', 'sms', 'stage_change', 'assignment_change'];
      if (!validTypes.includes(activityData.type)) {
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

      // Set default values
      const newActivity = {
        lead_id: activityData.lead_id,
        user_id: activityData.user_id,
        company_id: currentUser.company_id,
        type: activityData.type,
        description: activityData.description || null,
        metadata: activityData.metadata || {},
        created_at: new Date().toISOString()
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
  async updateActivity(activityId, updateData) {
    try {
      const trx = await db.transaction();

      try {
        // Check if activity exists
        const existingActivity = await trx('activities')
          .where('id', activityId)
          .first();

        if (!existingActivity) {
          throw new Error('Activity not found');
        }

        // Prepare update data
        const updateFields = {
          subject: updateData.subject,
          description: updateData.description,
          scheduled_at: updateData.scheduled_at,
          completed_at: updateData.completed_at,
          is_completed: updateData.is_completed,
          duration_minutes: updateData.duration_minutes,
          outcome: updateData.outcome,
          metadata: updateData.metadata,
          updated_at: new Date()
        };

        // Remove undefined values
        Object.keys(updateFields).forEach(key => {
          if (updateFields[key] === undefined) {
            delete updateFields[key];
          }
        });

        await trx('activities')
          .where('id', activityId)
          .update(updateFields);

        // If activity was marked as completed, update lead's last_contact_date
        if (updateData.is_completed && !existingActivity.is_completed && 
            existingActivity.activity_type !== 'note') {
          await trx('leads')
            .where('id', existingActivity.lead_id)
            .update({ 
              last_contact_date: new Date(),
              updated_at: new Date()
            });
        }

        await trx.commit();

        // Fetch the updated activity
        const updatedActivity = await this.getActivityById(activityId);

        return { success: true, data: updatedActivity.data };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete activity
  async deleteActivity(activityId) {
    try {
      const { error } = await supabaseAdmin
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        return { success: false, error: 'Activity not found or could not be deleted' };
      }

      return { success: true, message: 'Activity deleted successfully' };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark activity as completed
  async completeActivity(activityId, completionData = {}) {
    try {
      const trx = await db.transaction();

      try {
        const existingActivity = await trx('activities')
          .where('id', activityId)
          .first();

        if (!existingActivity) {
          throw new Error('Activity not found');
        }

        const updateData = {
          is_completed: true,
          completed_at: completionData.completed_at || new Date(),
          outcome: completionData.outcome || null,
          duration_minutes: completionData.duration_minutes || null,
          updated_at: new Date()
        };

        await trx('activities')
          .where('id', activityId)
          .update(updateData);

        // Update lead's last_contact_date if it's not a note
        if (existingActivity.activity_type !== 'note') {
          await trx('leads')
            .where('id', existingActivity.lead_id)
            .update({ 
              last_contact_date: new Date(),
              updated_at: new Date()
            });
        }

        await trx.commit();

        const updatedActivity = await this.getActivityById(activityId);

        return { success: true, data: updatedActivity.data };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
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
      const trx = await db.transaction();

      try {
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
            activity_type: activityData.activity_type,
            subject: activityData.subject || null,
            description: activityData.description || null,
            scheduled_at: activityData.scheduled_at || null,
            completed_at: activityData.completed_at || null,
            is_completed: activityData.is_completed || false,
            duration_minutes: activityData.duration_minutes || null,
            outcome: activityData.outcome || null,
            metadata: activityData.metadata || null,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        const activityIds = await trx('activities').insert(activities).returning('id');

        // Update last_contact_date for leads with completed activities
        const completedLeadIds = activities
          .filter(a => a.is_completed && a.activity_type !== 'note')
          .map(a => a.lead_id);

        if (completedLeadIds.length > 0) {
          await trx('leads')
            .whereIn('id', completedLeadIds)
            .update({ 
              last_contact_date: new Date(),
              updated_at: new Date()
            });
        }

        await trx.commit();

        return { success: true, data: { created_count: activityIds.length, activity_ids: activityIds } };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
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
