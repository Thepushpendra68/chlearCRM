const { supabaseAdmin } = require('../config/supabase');
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
  async globalSearch(query, limit = 10, currentUser = null) {
    try {
      // Search all modules in parallel
      const [leads, activities, tasks, users, contacts] = await Promise.all([
        this.searchLeads(query, limit, currentUser),
        this.searchActivities(query, limit, currentUser),
        this.searchTasks(query, limit, currentUser),
        this.searchUsers(query, limit, currentUser),
        this.searchContacts(query, limit, currentUser)
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
          href: `/app/leads/${lead.id}`
        })),
        contacts: contacts.map(contact => ({
          id: contact.id,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Contact',
          email: contact.email,
          phone: contact.phone || contact.mobile_phone,
          account_name: contact.account_name,
          status: contact.status,
          href: `/app/contacts/${contact.id}`
        })),
        activities: activities.map(activity => ({
          id: activity.id,
          title: activity.subject,
          type: activity.activity_type,
          lead_name: activity.lead_name,
          description: activity.description,
          created_at: activity.created_at,
          href: `/app/activities/${activity.id}`
        })),
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          due_date: task.due_date,
          priority: task.priority,
          description: task.description,
          href: `/app/tasks/${task.id}`
        })),
        users: users.map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          href: `/app/users/${user.id}`
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
  async searchLeads(searchTerm, limit, currentUser = null) {
    try {
      let query = supabaseAdmin
        .from('leads')
        .select(`
          *,
          user_profiles!leads_created_by_fkey(first_name, last_name)
        `);

      // Apply company filter if user is provided
      if (currentUser) {
        query = query.eq('company_id', currentUser.company_id);
      }

      // Apply search filters - Supabase text search
      const searchFilter = `%${searchTerm}%`;
      query = query.or(`first_name.ilike.${searchFilter},last_name.ilike.${searchFilter},email.ilike.${searchFilter},company.ilike.${searchFilter},phone.ilike.${searchFilter},notes.ilike.${searchFilter}`);

      query = query.limit(limit);

      const { data: leads, error } = await query;

      if (error) {
        console.error('Leads search error:', error);
        return [];
      }

      // Format the response to match expected structure
      return leads.map(lead => ({
        ...lead,
        lead_name: `${lead.first_name} ${lead.last_name}`,
        created_by_name: lead.user_profiles ? `${lead.user_profiles.first_name} ${lead.user_profiles.last_name}` : '',
        user_profiles: undefined // Remove nested object
      }));
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
  async searchActivities(searchTerm, limit, currentUser = null) {
    try {
      let query = supabaseAdmin
        .from('activities')
        .select(`
          *,
          leads!activities_lead_id_fkey(first_name, last_name, company),
          user_profiles!activities_user_id_fkey(first_name, last_name)
        `);

      // Apply company filter if user is provided
      if (currentUser) {
        query = query.eq('company_id', currentUser.company_id);
      }

      // Apply search filters
      const searchFilter = `%${searchTerm}%`;
      query = query.or(`subject.ilike.${searchFilter},description.ilike.${searchFilter},activity_type.ilike.${searchFilter},leads.first_name.ilike.${searchFilter},leads.last_name.ilike.${searchFilter},leads.company.ilike.${searchFilter}`);

      query = query.limit(limit);

      const { data: activities, error } = await query;

      if (error) {
        console.error('Activities search error:', error);
        return [];
      }

      // Format the response to match expected structure
      return activities.map(activity => ({
        ...activity,
        lead_name: activity.leads ? `${activity.leads.first_name} ${activity.leads.last_name}` : '',
        user_name: activity.user_profiles ? `${activity.user_profiles.first_name} ${activity.user_profiles.last_name}` : '',
        leads: undefined, // Remove nested objects
        user_profiles: undefined
      }));
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
  async searchTasks(searchTerm, limit, currentUser = null) {
    try {
      let query = supabaseAdmin
        .from('tasks')
        .select(`
          *,
          leads!tasks_lead_id_fkey(first_name, last_name, company),
          user_profiles!tasks_assigned_to_fkey(first_name, last_name)
        `);

      // Apply company filter if user is provided
      if (currentUser) {
        query = query.eq('company_id', currentUser.company_id);
      }

      // Apply search filters
      const searchFilter = `%${searchTerm}%`;
      query = query.or(`title.ilike.${searchFilter},description.ilike.${searchFilter},status.ilike.${searchFilter},leads.first_name.ilike.${searchFilter},leads.last_name.ilike.${searchFilter},leads.company.ilike.${searchFilter}`);

      query = query.limit(limit);

      const { data: tasks, error } = await query;

      if (error) {
        console.error('Tasks search error:', error);
        return [];
      }

      // Format the response to match expected structure
      return tasks.map(task => ({
        ...task,
        lead_name: task.leads ? `${task.leads.first_name} ${task.leads.last_name}` : '',
        assigned_to_name: task.user_profiles ? `${task.user_profiles.first_name} ${task.user_profiles.last_name}` : '',
        leads: undefined, // Remove nested objects
        user_profiles: undefined
      }));
    } catch (error) {
      console.error('Tasks search error:', error);
      return [];
    }
  }

  /**
   * Search contacts
   * @param {string} searchTerm
   * @param {number} limit
   * @param {Object|null} currentUser
   * @returns {Array}
   */
  async searchContacts(searchTerm, limit, currentUser = null) {
    try {
      let query = supabaseAdmin
        .from('contacts')
        .select(`
          *,
          account:accounts!account_id(id, name)
        `);

      if (currentUser) {
        query = query.eq('company_id', currentUser.company_id);
      }

      const searchFilter = `%${searchTerm}%`;
      query = query.or(`first_name.ilike.${searchFilter},last_name.ilike.${searchFilter},email.ilike.${searchFilter},phone.ilike.${searchFilter},mobile_phone.ilike.${searchFilter},notes.ilike.${searchFilter},title.ilike.${searchFilter}`);

      query = query.limit(limit);

      const { data: contacts, error } = await query;

      if (error) {
        console.error('Contacts search error:', error);
        return [];
      }

      return contacts.map(contact => ({
        ...contact,
        account_name: contact.account?.name || null,
        account_id: contact.account?.id || contact.account_id || null,
        account: undefined
      }));
    } catch (error) {
      console.error('Contacts search error:', error);
      return [];
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - SQL search term with wildcards
   * @param {number} limit - Maximum results
   * @returns {Array} User results
   */
  async searchUsers(searchTerm, limit, currentUser = null) {
    try {
      let query = supabaseAdmin
        .from('user_profiles')
        .select(`
          *,
          companies(name)
        `);

      // Apply company filter if user is provided (users can only see users in their company)
      if (currentUser) {
        query = query.eq('company_id', currentUser.company_id);
      }

      // Apply search filters
      const searchFilter = `%${searchTerm}%`;
      query = query.or(`first_name.ilike.${searchFilter},last_name.ilike.${searchFilter},email.ilike.${searchFilter},role.ilike.${searchFilter}`);

      query = query.limit(limit);

      const { data: users, error } = await query;

      if (error) {
        console.error('Users search error:', error);
        return [];
      }

      // Format the response to match expected structure
      return users.map(user => ({
        ...user,
        company_name: user.companies?.name || '',
        companies: undefined // Remove nested object
      }));
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
  async getSuggestions(query, currentUser = null) {
    try {
      const searchTerm = `%${query}%`;

      // Get suggestions from different modules in parallel
      const [leadSuggestions, activitySuggestions, taskSuggestions] = await Promise.all([
        // Lead suggestions
        supabaseAdmin
          .from('leads')
          .select('first_name, last_name, company')
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},company.ilike.${searchTerm}`)
          .limit(3),

        // Activity suggestions
        supabaseAdmin
          .from('activities')
          .select('subject, activity_type')
          .or(`subject.ilike.${searchTerm},activity_type.ilike.${searchTerm}`)
          .limit(3),

        // Task suggestions
        supabaseAdmin
          .from('tasks')
          .select('title, status')
          .or(`title.ilike.${searchTerm},status.ilike.${searchTerm}`)
          .limit(3)
      ]);

      const suggestions = [];

      // Process lead suggestions
      if (leadSuggestions.data) {
        leadSuggestions.data.forEach(lead => {
          if (lead.first_name && lead.last_name) {
            suggestions.push({
              text: `${lead.first_name} ${lead.last_name}`,
              type: 'lead',
              category: 'People'
            });
          }
          if (lead.company) {
            suggestions.push({
              text: lead.company,
              type: 'company',
              category: 'Companies'
            });
          }
        });
      }

      // Process activity suggestions
      if (activitySuggestions.data) {
        activitySuggestions.data.forEach(activity => {
          if (activity.subject) {
            suggestions.push({
              text: activity.subject,
              type: 'activity',
              category: 'Activities'
            });
          }
        });
      }

      // Process task suggestions
      if (taskSuggestions.data) {
        taskSuggestions.data.forEach(task => {
          if (task.title) {
            suggestions.push({
              text: task.title,
              type: 'task',
              category: 'Tasks'
            });
          }
        });
      }

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
