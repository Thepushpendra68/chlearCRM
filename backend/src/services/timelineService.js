const { supabaseAdmin } = require('../config/supabase');

class TimelineService {
  // Get comprehensive lead timeline with all related data
  async getLeadTimeline(leadId, options = {}) {
    try {
      const {
        includeActivities = true,
        includeStageChanges = true,
        includeAssignments = true,
        limit = 100,
        dateFrom = null,
        dateTo = null
      } = options;

      const timeline = [];

      // Build base query for activities
      let activitiesQuery = supabaseAdmin
        .from('activities')
        .select(`
          *,
          user_profiles!activities_user_id_fkey(first_name, last_name, email),
          leads!activities_lead_id_fkey(company),
          pipeline_stages(name, color)
        `)
        .eq('lead_id', leadId);

      // Apply date filters
      if (dateFrom) {
        activitiesQuery = activitiesQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        activitiesQuery = activitiesQuery.lte('created_at', dateTo);
      }

      const { data: allActivities, error } = await activitiesQuery.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      // Process activities by type
      allActivities.forEach(activity => {
        const user = activity.user_profiles ? {
          id: activity.user_id,
          name: `${activity.user_profiles.first_name || ''} ${activity.user_profiles.last_name || ''}`.trim(),
          email: activity.user_profiles.email
        } : null;

        if (includeActivities && activity.activity_type !== 'stage_change' && activity.activity_type !== 'assignment_change') {
          timeline.push({
            id: activity.id,
            type: 'activity',
            activity_type: activity.activity_type,
            subject: activity.subject,
            description: activity.description,
            scheduled_at: activity.scheduled_at,
            completed_at: activity.completed_at,
            is_completed: activity.is_completed,
            duration_minutes: activity.duration_minutes,
            outcome: activity.outcome,
            metadata: activity.metadata,
            created_at: activity.created_at,
            user
          });
        }

        // Handle stage changes
        if (includeStageChanges && activity.activity_type === 'stage_change') {
          timeline.push({
            id: activity.id,
            type: 'stage_change',
            activity_type: 'stage_change',
            subject: activity.subject || `Moved to ${activity.pipeline_stages?.name || 'Unknown'}`,
            description: activity.description,
            metadata: activity.metadata,
            created_at: activity.created_at,
            stage: {
              name: activity.pipeline_stages?.name,
              color: activity.pipeline_stages?.color
            },
            user
          });
        }

        // Handle assignment changes
        if (includeAssignments && activity.activity_type === 'assignment_change') {
          // For assignment changes, we need to get the metadata to understand the change
          const metadata = activity.metadata || {};
          timeline.push({
            id: activity.id,
            type: 'assignment_change',
            activity_type: 'assignment_change',
            subject: activity.subject || 'Lead assignment changed',
            description: activity.description,
            metadata: activity.metadata,
            created_at: activity.created_at,
            assignment: {
              previous: {
                name: metadata.previous_assigned_to_name || 'Unassigned'
              },
              new: {
                name: metadata.new_assigned_to_name || 'Unassigned'
              }
            },
            user
          });
        }
      });

      // Sort timeline by created_at desc
      timeline.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Limit results
      const limitedTimeline = timeline.slice(0, limit);

      return { success: true, data: limitedTimeline };
    } catch (error) {
      console.error('Error fetching lead timeline:', error);
      return { success: false, error: error.message };
    }
  }

  // Get timeline summary for a lead
  async getLeadTimelineSummary(leadId) {
    try {
      // Get all activities for this lead
      const { data: activities, error } = await supabaseAdmin
        .from('activities')
        .select('activity_type, is_completed, created_at')
        .eq('lead_id', leadId);

      if (error) {
        console.error('Error fetching activities for summary:', error);
        return { success: false, error: error.message };
      }

      // Calculate summary statistics
      const totalActivities = activities.length;
      const calls = activities.filter(a => a.activity_type === 'call').length;
      const emails = activities.filter(a => a.activity_type === 'email').length;
      const meetings = activities.filter(a => a.activity_type === 'meeting').length;
      const notes = activities.filter(a => a.activity_type === 'note').length;
      const tasks = activities.filter(a => a.activity_type === 'task').length;
      const completedActivities = activities.filter(a => a.is_completed).length;

      const dates = activities.map(a => new Date(a.created_at));
      const lastActivityDate = dates.length > 0 ? Math.max(...dates) : null;
      const firstActivityDate = dates.length > 0 ? Math.min(...dates) : null;

      const summary = {
        total_activities: totalActivities,
        calls,
        emails,
        meetings,
        notes,
        tasks,
        completed_activities: completedActivities,
        last_activity_date: lastActivityDate ? lastActivityDate.toISOString() : null,
        first_activity_date: firstActivityDate ? firstActivityDate.toISOString() : null
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Error fetching timeline summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's activity timeline
  async getUserTimeline(userId, options = {}) {
    try {
      const {
        limit = 50,
        dateFrom = null,
        dateTo = null,
        activityTypes = null
      } = options;

      let query = supabaseAdmin
        .from('activities')
        .select(`
          *,
          leads!activities_lead_id_fkey(first_name, last_name, company, email)
        `)
        .eq('user_id', userId);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      if (activityTypes && Array.isArray(activityTypes)) {
        query = query.in('activity_type', activityTypes);
      }

      const { data: activities, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user timeline:', error);
        return { success: false, error: error.message };
      }

      // Format the response to match expected structure
      const formattedActivities = activities.map(activity => ({
        ...activity,
        contact_name: activity.leads ? `${activity.leads.first_name} ${activity.leads.last_name}` : '',
        lead_email: activity.leads?.email || '',
        company: activity.leads?.company || '',
        leads: undefined // Remove nested object
      }));

      return { success: true, data: formattedActivities };
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      return { success: false, error: error.message };
    }
  }

  // Get team activity timeline
  async getTeamTimeline(teamUserIds, options = {}) {
    try {
      const {
        limit = 100,
        dateFrom = null,
        dateTo = null,
        activityTypes = null
      } = options;

      let query = supabaseAdmin
        .from('activities')
        .select(`
          *,
          leads!activities_lead_id_fkey(first_name, last_name, company, email),
          user_profiles!activities_user_id_fkey(first_name, last_name, email)
        `)
        .in('user_id', teamUserIds);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      if (activityTypes && Array.isArray(activityTypes)) {
        query = query.in('activity_type', activityTypes);
      }

      const { data: activities, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching team timeline:', error);
        return { success: false, error: error.message };
      }

      // Format the response to match expected structure
      const formattedActivities = activities.map(activity => ({
        ...activity,
        contact_name: activity.leads ? `${activity.leads.first_name} ${activity.leads.last_name}` : '',
        lead_email: activity.leads?.email || '',
        company: activity.leads?.company || '',
        first_name: activity.user_profiles?.first_name || '',
        last_name: activity.user_profiles?.last_name || '',
        user_email: activity.user_profiles?.email || '',
        leads: undefined, // Remove nested objects
        user_profiles: undefined
      }));

      return { success: true, data: formattedActivities };
    } catch (error) {
      console.error('Error fetching team timeline:', error);
      return { success: false, error: error.message };
    }
  }

  // Get activity trends over time
  async getActivityTrends(filters = {}) {
    try {
      const {
        user_id = null,
        lead_id = null,
        dateFrom = null,
        dateTo = null,
        groupBy = 'day' // 'day', 'week', 'month'
      } = filters;

      // Get activities with filters
      let query = supabaseAdmin
        .from('activities')
        .select('activity_type, is_completed, created_at');

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      if (lead_id) {
        query = query.eq('lead_id', lead_id);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: activities, error } = await query;

      if (error) {
        console.error('Error fetching activities for trends:', error);
        return { success: false, error: error.message };
      }

      // Group activities by date period and calculate aggregations
      const trendsMap = new Map();

      activities.forEach(activity => {
        const date = new Date(activity.created_at);
        let periodKey;

        switch (groupBy) {
          case 'week':
            // Get start of week (Sunday)
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          default: // day
            periodKey = date.toISOString().split('T')[0];
        }

        if (!trendsMap.has(periodKey)) {
          trendsMap.set(periodKey, {
            period: periodKey,
            total_activities: 0,
            calls: 0,
            emails: 0,
            meetings: 0,
            completed: 0
          });
        }

        const trend = trendsMap.get(periodKey);
        trend.total_activities++;

        switch (activity.activity_type) {
          case 'call':
            trend.calls++;
            break;
          case 'email':
            trend.emails++;
            break;
          case 'meeting':
            trend.meetings++;
            break;
        }

        if (activity.is_completed) {
          trend.completed++;
        }
      });

      // Convert map to array and sort by period
      const trends = Array.from(trendsMap.values()).sort((a, b) => a.period.localeCompare(b.period));

      return { success: true, data: trends };
    } catch (error) {
      console.error('Error fetching activity trends:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TimelineService();
