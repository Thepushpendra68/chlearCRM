const db = require('../config/database');

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

      // Get activities
      if (includeActivities) {
        const activities = await db('activities')
          .select(
            'activities.*',
            'users.first_name',
            'users.last_name',
            'users.email as user_email'
          )
          .leftJoin('users', 'activities.user_id', 'users.id')
          .where('activities.lead_id', leadId)
          .modify((query) => {
            if (dateFrom) query.where('activities.created_at', '>=', dateFrom);
            if (dateTo) query.where('activities.created_at', '<=', dateTo);
          })
          .orderBy('activities.created_at', 'desc')
          .limit(limit);

        activities.forEach(activity => {
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
            user: {
              id: activity.user_id,
              name: `${activity.first_name || ''} ${activity.last_name || ''}`.trim(),
              email: activity.user_email
            }
          });
        });
      }

      // Get stage changes (from activities with type 'stage_change')
      if (includeStageChanges) {
        const stageChanges = await db('activities')
          .select(
            'activities.*',
            'pipeline_stages.name as stage_name',
            'pipeline_stages.color as stage_color',
            'users.first_name',
            'users.last_name'
          )
          .leftJoin('pipeline_stages', 'activities.metadata->>new_stage_id', 'pipeline_stages.id')
          .leftJoin('users', 'activities.user_id', 'users.id')
          .where('activities.lead_id', leadId)
          .where('activities.activity_type', 'stage_change')
          .modify((query) => {
            if (dateFrom) query.where('activities.created_at', '>=', dateFrom);
            if (dateTo) query.where('activities.created_at', '<=', dateTo);
          })
          .orderBy('activities.created_at', 'desc');

        stageChanges.forEach(change => {
          timeline.push({
            id: change.id,
            type: 'stage_change',
            activity_type: 'stage_change',
            subject: change.subject || `Moved to ${change.stage_name}`,
            description: change.description,
            metadata: change.metadata,
            created_at: change.created_at,
            stage: {
              name: change.stage_name,
              color: change.stage_color
            },
            user: {
              id: change.user_id,
              name: `${change.first_name || ''} ${change.last_name || ''}`.trim()
            }
          });
        });
      }

      // Get assignment changes (from activities with type 'assignment_change')
      if (includeAssignments) {
        const assignmentChanges = await db('activities')
          .select(
            'activities.*',
            'prev_user.first_name as prev_first_name',
            'prev_user.last_name as prev_last_name',
            'new_user.first_name as new_first_name',
            'new_user.last_name as new_last_name',
            'assigned_by_user.first_name as assigned_by_first_name',
            'assigned_by_user.last_name as assigned_by_last_name'
          )
          .leftJoin('users as prev_user', 'activities.metadata->>previous_assigned_to', 'prev_user.id')
          .leftJoin('users as new_user', 'activities.metadata->>new_assigned_to', 'new_user.id')
          .leftJoin('users as assigned_by_user', 'activities.user_id', 'assigned_by_user.id')
          .where('activities.lead_id', leadId)
          .where('activities.activity_type', 'assignment_change')
          .modify((query) => {
            if (dateFrom) query.where('activities.created_at', '>=', dateFrom);
            if (dateTo) query.where('activities.created_at', '<=', dateTo);
          })
          .orderBy('activities.created_at', 'desc');

        assignmentChanges.forEach(change => {
          timeline.push({
            id: change.id,
            type: 'assignment_change',
            activity_type: 'assignment_change',
            subject: change.subject || 'Lead assignment changed',
            description: change.description,
            metadata: change.metadata,
            created_at: change.created_at,
            assignment: {
              previous: {
                name: `${change.prev_first_name || ''} ${change.prev_last_name || ''}`.trim()
              },
              new: {
                name: `${change.new_first_name || ''} ${change.new_last_name || ''}`.trim()
              }
            },
            user: {
              id: change.user_id,
              name: `${change.assigned_by_first_name || ''} ${change.assigned_by_last_name || ''}`.trim()
            }
          });
        });
      }

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
      const summary = await db('activities')
        .select(
          db.raw('COUNT(*) as total_activities'),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as calls', ['call']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as emails', ['email']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as meetings', ['meeting']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as notes', ['note']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as tasks', ['task']),
          db.raw('COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_activities'),
          db.raw('MAX(created_at) as last_activity_date'),
          db.raw('MIN(created_at) as first_activity_date')
        )
        .where('lead_id', leadId)
        .first();

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

      let query = db('activities')
        .select(
          'activities.*',
          'leads.company',
          db.raw("CONCAT(leads.first_name, ' ', leads.last_name) as contact_name"),
          'leads.email as lead_email'
        )
        .leftJoin('leads', 'activities.lead_id', 'leads.id')
        .where('activities.user_id', userId);

      if (dateFrom) {
        query = query.where('activities.created_at', '>=', dateFrom);
      }

      if (dateTo) {
        query = query.where('activities.created_at', '<=', dateTo);
      }

      if (activityTypes && Array.isArray(activityTypes)) {
        query = query.whereIn('activities.activity_type', activityTypes);
      }

      const activities = await query
        .orderBy('activities.created_at', 'desc')
        .limit(limit);

      return { success: true, data: activities };
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

      let query = db('activities')
        .select(
          'activities.*',
          'leads.company',
          db.raw("CONCAT(leads.first_name, ' ', leads.last_name) as contact_name"),
          'users.first_name',
          'users.last_name',
          'users.email as user_email'
        )
        .leftJoin('leads', 'activities.lead_id', 'leads.id')
        .leftJoin('users', 'activities.user_id', 'users.id')
        .whereIn('activities.user_id', teamUserIds);

      if (dateFrom) {
        query = query.where('activities.created_at', '>=', dateFrom);
      }

      if (dateTo) {
        query = query.where('activities.created_at', '<=', dateTo);
      }

      if (activityTypes && Array.isArray(activityTypes)) {
        query = query.whereIn('activities.activity_type', activityTypes);
      }

      const activities = await query
        .orderBy('activities.created_at', 'desc')
        .limit(limit);

      return { success: true, data: activities };
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

      let query = db('activities');

      if (user_id) {
        query = query.where('user_id', user_id);
      }

      if (lead_id) {
        query = query.where('lead_id', lead_id);
      }

      if (dateFrom) {
        query = query.where('created_at', '>=', dateFrom);
      }

      if (dateTo) {
        query = query.where('created_at', '<=', dateTo);
      }

      let dateFormat;
      switch (groupBy) {
        case 'week':
          dateFormat = "DATE_TRUNC('week', created_at)";
          break;
        case 'month':
          dateFormat = "DATE_TRUNC('month', created_at)";
          break;
        default:
          dateFormat = "DATE_TRUNC('day', created_at)";
      }

      const trends = await query
        .select(
          db.raw(`${dateFormat} as period`),
          db.raw('COUNT(*) as total_activities'),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as calls', ['call']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as emails', ['email']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as meetings', ['meeting']),
          db.raw('COUNT(CASE WHEN is_completed = true THEN 1 END) as completed')
        )
        .groupBy('period')
        .orderBy('period', 'asc');

      return { success: true, data: trends };
    } catch (error) {
      console.error('Error fetching activity trends:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TimelineService();
