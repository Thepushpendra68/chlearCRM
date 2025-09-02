import api from './api';

class ActivityService {
  // Get activities with filters
  async getActivities(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/activities?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  // Get activity by ID
  async getActivityById(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  }

  // Create new activity
  async createActivity(activityData) {
    try {
      const response = await api.post('/activities', activityData);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  // Update activity
  async updateActivity(activityId, updateData) {
    try {
      const response = await api.put(`/activities/${activityId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  // Delete activity
  async deleteActivity(activityId) {
    try {
      const response = await api.delete(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  // Mark activity as completed
  async completeActivity(activityId, completionData = {}) {
    try {
      const response = await api.put(`/activities/${activityId}/complete`, completionData);
      return response.data;
    } catch (error) {
      console.error('Error completing activity:', error);
      throw error;
    }
  }

  // Get lead timeline
  async getLeadTimeline(leadId, options = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
          params.append(key, options[key]);
        }
      });

      const response = await api.get(`/activities/leads/${leadId}/timeline?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead timeline:', error);
      throw error;
    }
  }

  // Get lead activities (simplified)
  async getLeadActivities(leadId, limit = 50) {
    try {
      const response = await api.get(`/activities/leads/${leadId}/activities?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead activities:', error);
      throw error;
    }
  }

  // Get user's activities
  async getUserActivities(userId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/activities/users/${userId}/activities?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  // Get user timeline
  async getUserTimeline(userId, options = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
          params.append(key, options[key]);
        }
      });

      const response = await api.get(`/activities/users/${userId}/timeline?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      throw error;
    }
  }

  // Get team timeline
  async getTeamTimeline(userIds, options = {}) {
    try {
      const params = new URLSearchParams();
      params.append('user_ids', userIds.join(','));
      
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
          params.append(key, options[key]);
        }
      });

      const response = await api.get(`/activities/team/timeline?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team timeline:', error);
      throw error;
    }
  }

  // Create multiple activities (bulk)
  async createBulkActivities(activities) {
    try {
      const response = await api.post('/activities/bulk', { activities });
      return response.data;
    } catch (error) {
      console.error('Error creating bulk activities:', error);
      throw error;
    }
  }

  // Get activity statistics
  async getActivityStats(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/activities/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }

  // Get activity trends
  async getActivityTrends(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/activities/trends?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity trends:', error);
      throw error;
    }
  }

  // Get lead timeline summary
  async getLeadTimelineSummary(leadId) {
    try {
      const response = await api.get(`/activities/leads/${leadId}/timeline/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead timeline summary:', error);
      throw error;
    }
  }

  // Quick activity creation methods
  async logCall(leadId, callData) {
    return this.createActivity({
      lead_id: leadId,
      activity_type: 'call',
      subject: callData.subject || 'Phone Call',
      description: callData.description,
      duration_minutes: callData.duration_minutes,
      outcome: callData.outcome,
      is_completed: true,
      completed_at: new Date().toISOString()
    });
  }

  async logEmail(leadId, emailData) {
    return this.createActivity({
      lead_id: leadId,
      activity_type: 'email',
      subject: emailData.subject || 'Email Sent',
      description: emailData.description,
      is_completed: true,
      completed_at: new Date().toISOString()
    });
  }

  async logMeeting(leadId, meetingData) {
    return this.createActivity({
      lead_id: leadId,
      activity_type: 'meeting',
      subject: meetingData.subject || 'Meeting',
      description: meetingData.description,
      scheduled_at: meetingData.scheduled_at,
      duration_minutes: meetingData.duration_minutes,
      is_completed: meetingData.is_completed || false,
      completed_at: meetingData.completed_at
    });
  }

  async logNote(leadId, noteData) {
    return this.createActivity({
      lead_id: leadId,
      activity_type: 'note',
      subject: noteData.subject || 'Note',
      description: noteData.description,
      is_completed: true,
      completed_at: new Date().toISOString()
    });
  }

  async createTask(leadId, taskData) {
    return this.createActivity({
      lead_id: leadId,
      activity_type: 'task',
      subject: taskData.subject || 'Task',
      description: taskData.description,
      scheduled_at: taskData.scheduled_at,
      is_completed: false
    });
  }
}

export default new ActivityService();
