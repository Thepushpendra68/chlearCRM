const db = require('../config/database');
const leadService = require('./leadService');
const activityService = require('./activityService');
const taskService = require('./taskService');
const userService = require('./userService');

class SearchService {
  /**
   * Global search across all modules
   * @param {string} query - Search query
   * @param {number} limit - Maximum results per module
   * @returns {Object} Search results grouped by module
   */
  async globalSearch(query, limit = 10) {
    try {
      const searchTerm = `%${query}%`;
      
      // Search all modules in parallel
      const [leads, activities, tasks, users] = await Promise.all([
        this.searchLeads(searchTerm, limit),
        this.searchActivities(searchTerm, limit),
        this.searchTasks(searchTerm, limit),
        this.searchUsers(searchTerm, limit)
      ]);

      return {
        leads: leads.map(lead => ({
          id: lead.id,
          name: `${lead.first_name} ${lead.last_name}`,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          company: lead.company,
          phone: lead.phone,
          status: lead.status,
          href: `/leads/${lead.id}`
        })),
        activities: activities.map(activity => ({
          id: activity.id,
          title: activity.subject,
          type: activity.activity_type,
          lead_name: activity.lead_name,
          description: activity.description,
          created_at: activity.created_at,
          href: `/activities/${activity.id}`
        })),
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          due_date: task.due_date,
          priority: task.priority,
          description: task.description,
          href: `/tasks/${task.id}`
        })),
        users: users.map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          href: `/users/${user.id}`
        }))
      };
    } catch (error) {
      console.error('Global search error:', error);
      throw new Error('Search failed');
    }
  }

  /**
   * Search leads
   * @param {string} searchTerm - SQL search term with wildcards
   * @param {number} limit - Maximum results
   * @returns {Array} Lead results
   */
  async searchLeads(searchTerm, limit) {
    try {
      const leads = await db('leads')
        .select(
          'leads.*',
          db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name')
        )
        .where(function() {
          this.where('first_name', 'ilike', searchTerm)
            .orWhere('last_name', 'ilike', searchTerm)
            .orWhere('email', 'ilike', searchTerm)
            .orWhere('company', 'ilike', searchTerm)
            .orWhere('phone', 'ilike', searchTerm)
            .orWhere('notes', 'ilike', searchTerm);
        })
        .limit(limit);

      return leads;
    } catch (error) {
      console.error('Leads search error:', error);
      return [];
    }
  }

  /**
   * Search activities
   * @param {string} searchTerm - SQL search term with wildcards
   * @param {number} limit - Maximum results
   * @returns {Array} Activity results
   */
  async searchActivities(searchTerm, limit) {
    try {
      const activities = await db('activities')
        .select(
          'activities.*',
          db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name')
        )
        .leftJoin('leads', 'activities.lead_id', 'leads.id')
        .where(function() {
          this.where('activities.subject', 'ilike', searchTerm)
            .orWhere('activities.description', 'ilike', searchTerm)
            .orWhere('activities.activity_type', 'ilike', searchTerm)
            .orWhere('leads.first_name', 'ilike', searchTerm)
            .orWhere('leads.last_name', 'ilike', searchTerm)
            .orWhere('leads.company', 'ilike', searchTerm);
        })
        .limit(limit);

      return activities;
    } catch (error) {
      console.error('Activities search error:', error);
      return [];
    }
  }

  /**
   * Search tasks
   * @param {string} searchTerm - SQL search term with wildcards
   * @param {number} limit - Maximum results
   * @returns {Array} Task results
   */
  async searchTasks(searchTerm, limit) {
    try {
      const tasks = await db('tasks')
        .select(
          'tasks.*',
          db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name')
        )
        .leftJoin('leads', 'tasks.lead_id', 'leads.id')
        .where(function() {
          this.where('tasks.title', 'ilike', searchTerm)
            .orWhere('tasks.description', 'ilike', searchTerm)
            .orWhere('tasks.status', 'ilike', searchTerm)
            .orWhere('leads.first_name', 'ilike', searchTerm)
            .orWhere('leads.last_name', 'ilike', searchTerm)
            .orWhere('leads.company', 'ilike', searchTerm);
        })
        .limit(limit);

      return tasks;
    } catch (error) {
      console.error('Tasks search error:', error);
      return [];
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - SQL search term with wildcards
   * @param {number} limit - Maximum results
   * @returns {Array} User results
   */
  async searchUsers(searchTerm, limit) {
    try {
      const users = await db('users')
        .select('*')
        .where(function() {
          this.where('first_name', 'ilike', searchTerm)
            .orWhere('last_name', 'ilike', searchTerm)
            .orWhere('email', 'ilike', searchTerm)
            .orWhere('role', 'ilike', searchTerm);
        })
        .limit(limit);

      return users;
    } catch (error) {
      console.error('Users search error:', error);
      return [];
    }
  }

  /**
   * Get search suggestions
   * @param {string} query - Search query
   * @returns {Array} Search suggestions
   */
  async getSuggestions(query) {
    try {
      const searchTerm = `%${query}%`;
      
      // Get suggestions from different modules
      const [leadSuggestions, activitySuggestions, taskSuggestions] = await Promise.all([
        db('leads')
          .select('first_name', 'last_name', 'company')
          .where(function() {
            this.where('first_name', 'ilike', searchTerm)
              .orWhere('last_name', 'ilike', searchTerm)
              .orWhere('company', 'ilike', searchTerm);
          })
          .limit(3),
        
        db('activities')
          .select('subject', 'activity_type')
          .where(function() {
            this.where('subject', 'ilike', searchTerm)
              .orWhere('activity_type', 'ilike', searchTerm);
          })
          .limit(3),
        
        db('tasks')
          .select('title', 'status')
          .where(function() {
            this.where('title', 'ilike', searchTerm)
              .orWhere('status', 'ilike', searchTerm);
          })
          .limit(3)
      ]);

      const suggestions = [
        ...leadSuggestions.map(lead => ({
          text: `${lead.first_name} ${lead.last_name}`,
          type: 'lead',
          category: 'People'
        })),
        ...leadSuggestions.map(lead => ({
          text: lead.company,
          type: 'company',
          category: 'Companies'
        })),
        ...activitySuggestions.map(activity => ({
          text: activity.subject,
          type: 'activity',
          category: 'Activities'
        })),
        ...taskSuggestions.map(task => ({
          text: task.title,
          type: 'task',
          category: 'Tasks'
        }))
      ];

      // Remove duplicates and limit results
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      ).slice(0, 10);

      return uniqueSuggestions;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }
}

module.exports = new SearchService();
