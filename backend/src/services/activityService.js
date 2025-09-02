const db = require('../config/database');

class ActivityService {
  // Get activities with filters
  async getActivities(filters = {}) {
    try {
      let query = db('activities')
        .select(
          'activities.*',
          'leads.company',
          db.raw("CONCAT(leads.first_name, ' ', leads.last_name) as contact_name"),
          'users.first_name',
          'users.last_name'
        )
        .leftJoin('leads', 'activities.lead_id', 'leads.id')
        .leftJoin('users', 'activities.user_id', 'users.id');

      // Apply filters
      if (filters.lead_id) {
        query = query.where('activities.lead_id', filters.lead_id);
      }

      if (filters.user_id) {
        query = query.where('activities.user_id', filters.user_id);
      }

      if (filters.activity_type) {
        query = query.where('activities.activity_type', filters.activity_type);
      }

      if (filters.is_completed !== undefined) {
        query = query.where('activities.is_completed', filters.is_completed);
      }

      if (filters.date_from) {
        query = query.where('activities.created_at', '>=', filters.date_from);
      }

      if (filters.date_to) {
        query = query.where('activities.created_at', '<=', filters.date_to);
      }

      if (filters.scheduled_from) {
        query = query.where('activities.scheduled_at', '>=', filters.scheduled_from);
      }

      if (filters.scheduled_to) {
        query = query.where('activities.scheduled_at', '<=', filters.scheduled_to);
      }

      // Order by created_at desc by default
      query = query.orderBy('activities.created_at', 'desc');

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      const activities = await query;

      return { success: true, data: activities };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: error.message };
    }
  }

  // Get activity by ID
  async getActivityById(activityId) {
    try {
      const activity = await db('activities')
        .select(
          'activities.*',
          'leads.company',
          db.raw("CONCAT(leads.first_name, ' ', leads.last_name) as contact_name"),
          'users.first_name',
          'users.last_name'
        )
        .leftJoin('leads', 'activities.lead_id', 'leads.id')
        .leftJoin('users', 'activities.user_id', 'users.id')
        .where('activities.id', activityId)
        .first();

      if (!activity) {
        return { success: false, error: 'Activity not found' };
      }

      return { success: true, data: activity };
    } catch (error) {
      console.error('Error fetching activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new activity
  async createActivity(activityData) {
    try {
      const trx = await db.transaction();

      try {
        // Validate required fields
        if (!activityData.lead_id || !activityData.user_id || !activityData.activity_type) {
          throw new Error('lead_id, user_id, and activity_type are required');
        }

        // Validate activity type
        const validTypes = ['call', 'email', 'meeting', 'note', 'task', 'sms', 'stage_change', 'assignment_change'];
        if (!validTypes.includes(activityData.activity_type)) {
          throw new Error('Invalid activity type');
        }

        // Set default values
        const newActivity = {
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
        };

        const [activityId] = await trx('activities').insert(newActivity).returning('id');

        // If it's a completed activity, update the lead's last_contact_date
        if (newActivity.is_completed && newActivity.activity_type !== 'note') {
          await trx('leads')
            .where('id', newActivity.lead_id)
            .update({ 
              last_contact_date: new Date(),
              updated_at: new Date()
            });
        }

        await trx.commit();

        // Fetch the created activity with joins
        const createdActivity = await this.getActivityById(activityId.id);

        return { success: true, data: createdActivity.data };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
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
      const deleted = await db('activities')
        .where('id', activityId)
        .del();

      if (deleted === 0) {
        return { success: false, error: 'Activity not found' };
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
      const activities = await db('activities')
        .select(
          'activities.*',
          'users.first_name',
          'users.last_name',
          'users.email as user_email'
        )
        .leftJoin('users', 'activities.user_id', 'users.id')
        .where('activities.lead_id', leadId)
        .orderBy('activities.created_at', 'desc')
        .limit(limit);

      return { success: true, data: activities };
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
      let query = db('activities');

      // Apply filters
      if (filters.user_id) {
        query = query.where('user_id', filters.user_id);
      }

      if (filters.lead_id) {
        query = query.where('lead_id', filters.lead_id);
      }

      if (filters.date_from) {
        query = query.where('created_at', '>=', filters.date_from);
      }

      if (filters.date_to) {
        query = query.where('created_at', '<=', filters.date_to);
      }

      const stats = await query
        .select(
          db.raw('COUNT(*) as total_activities'),
          db.raw('COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_activities'),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as calls', ['call']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as emails', ['email']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as meetings', ['meeting']),
          db.raw('COUNT(CASE WHEN activity_type = ? THEN 1 END) as notes', ['note']),
          db.raw('AVG(duration_minutes) as avg_duration')
        )
        .first();

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ActivityService();
