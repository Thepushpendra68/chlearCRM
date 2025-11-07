const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

class TaskService {
  /**
   * Get tasks with filters
   */
  async getTasks(currentUser, filters = {}) {
    try {
      const supabase = supabaseAdmin;

      // Build base query with joins
      let query = supabase
        .from('tasks')
        .select(`
          *,
          leads(name),
          assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name),
          created_user:user_profiles!tasks_created_by_fkey(first_name, last_name)
        `)
        .eq('company_id', currentUser.company_id);

      // Non-admin users only see their assigned tasks
      if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
        query = query.eq('assigned_to', currentUser.id);
      }

      // Apply filters
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }

      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.task_type) {
        query = query.eq('task_type', filters.task_type);
      }

      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }

      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      if (filters.overdue) {
        const now = new Date().toISOString();
        query = query.lt('due_date', now).neq('status', 'completed');
      }

      // Order by due date and priority
      query = query.order('due_date', { ascending: true, nullsLast: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100); // Add limit to prevent large result sets

      const { data: tasks, error } = await query;

      if (error) {
        console.error('TaskService.getTasks error:', error);
        console.error('Query that failed:', query);
        throw new ApiError('Failed to fetch tasks', 500);
      }

      // Format the data to match expected structure
      const formattedTasks = tasks.map(task => ({
        ...task,
        lead_name: task.leads?.name,
        assigned_first_name: task.assigned_user?.first_name,
        assigned_last_name: task.assigned_user?.last_name,
        assigned_email: task.assigned_user?.email,
        created_first_name: task.created_user?.first_name,
        created_last_name: task.created_user?.last_name,
        // Remove the nested objects
        leads: undefined,
        assigned_user: undefined,
        created_user: undefined
      }));

      return formattedTasks || [];
    } catch (error) {
      console.error('TaskService.getTasks error:', error);
      throw new ApiError('Failed to fetch tasks', 500);
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          leads!tasks_lead_id_fkey(name),
          assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name, email),
          created_user:user_profiles!tasks_created_by_fkey(first_name, last_name)
        `)
        .eq('id', taskId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (error || !task) {
        throw new ApiError('Task not found', 404);
      }

      // Format the data to match expected structure
      const formattedTask = {
        ...task,
        lead_name: task.leads?.name,
        assigned_first_name: task.assigned_user?.first_name,
        assigned_last_name: task.assigned_user?.last_name,
        assigned_email: task.assigned_user?.email,
        created_first_name: task.created_user?.first_name,
        created_last_name: task.created_user?.last_name,
        // Remove the nested objects
        leads: undefined,
        assigned_user: undefined,
        created_user: undefined
      };

      return formattedTask;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch task', 500);
    }
  }

  /**
   * Create new task
   */
  async createTask(taskData, currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Validate that assigned user exists and belongs to company
      if (taskData.assigned_to) {
        const { data: assignedUser, error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', taskData.assigned_to)
          .eq('company_id', currentUser.company_id)
          .single();

        if (userError || !assignedUser) {
          throw new ApiError('Assigned user not found', 404);
        }
      }

      // Validate that lead exists and belongs to company (if provided)
      if (taskData.lead_id) {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('id')
          .eq('id', taskData.lead_id)
          .eq('company_id', currentUser.company_id)
          .single();

        if (leadError || !lead) {
          throw new ApiError('Lead not found', 404);
        }
      }

      // Validate that account exists and belongs to company (if provided)
      if (taskData.account_id) {
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', taskData.account_id)
          .eq('company_id', currentUser.company_id)
          .single();

        if (accountError || !account) {
          throw new ApiError('Account not found', 404);
        }
      }

      const newTask = {
        lead_id: taskData.lead_id || null,
        account_id: taskData.account_id || null,
        assigned_to: taskData.assigned_to,
        created_by: currentUser.id,
        company_id: currentUser.company_id,
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.due_date || null,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        task_type: taskData.task_type || 'follow_up',
        created_at: new Date().toISOString()
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        console.error('Task creation error:', error);
        throw new ApiError('Failed to create task', 500);
      }

      return task;
    } catch (error) {
      console.error('Task creation error:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create task', 500);
    }
  }

  /**
   * Update task
   */
  async updateTask(taskId, updateData, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: existingTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (fetchError || !existingTask) {
        throw new ApiError('Task not found', 404);
      }

      // Validate that assigned user exists and belongs to company if being updated
      if (updateData.assigned_to) {
        const { data: assignedUser, error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', updateData.assigned_to)
          .eq('company_id', currentUser.company_id)
          .single();

        if (userError || !assignedUser) {
          throw new ApiError('Assigned user not found', 404);
        }
      }

      // Validate that lead exists and belongs to company if being updated
      if (updateData.lead_id !== undefined && updateData.lead_id !== null) {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('id')
          .eq('id', updateData.lead_id)
          .eq('company_id', currentUser.company_id)
          .single();

        if (leadError || !lead) {
          throw new ApiError('Lead not found', 404);
        }
      }

      // Validate that account exists and belongs to company if being updated
      if (updateData.account_id !== undefined && updateData.account_id !== null) {
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', updateData.account_id)
          .eq('company_id', currentUser.company_id)
          .single();

        if (accountError || !account) {
          throw new ApiError('Account not found', 404);
        }
      }

      // Handle empty strings for foreign key fields
      const cleanedData = {
        ...updateData,
        lead_id: updateData.lead_id !== undefined ? (updateData.lead_id || null) : existingTask.lead_id,
        account_id: updateData.account_id !== undefined ? (updateData.account_id || null) : existingTask.account_id,
        due_date: updateData.due_date || null,
        updated_at: new Date().toISOString()
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .update(cleanedData)
        .eq('id', taskId)
        .eq('company_id', currentUser.company_id)
        .select()
        .single();

      if (error || !task) {
        throw new ApiError('Task not found', 404);
      }

      return {
        previousTask: existingTask,
        updatedTask: task
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Task update error:', error);
      throw new ApiError('Failed to update task', 500);
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId, userId, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: existingTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (fetchError || !existingTask) {
        throw new ApiError('Task not found', 404);
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('company_id', currentUser.company_id)
        .select()
        .single();

      if (error || !task) {
        throw new ApiError('Task not found', 404);
      }

      return {
        previousTask: existingTask,
        updatedTask: task
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to complete task', 500);
    }
  }

  /**
   * Delete task
   */
  async deleteTask(taskId, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: existingTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (fetchError || !existingTask) {
        throw new ApiError('Task not found', 404);
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('company_id', currentUser.company_id);

      if (error) {
        throw new ApiError('Task not found', 404);
      }

      return { success: true, deletedTask: existingTask };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete task', 500);
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(currentUser, userId = null) {
    try {
      const supabase = supabaseAdmin;

      let query = supabase
        .from('tasks')
        .select(`
          *,
          leads!tasks_lead_id_fkey(name),
          assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name)
        `)
        .eq('company_id', currentUser.company_id)
        .lt('due_date', new Date().toISOString())
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      // If userId is provided, filter by assigned user
      if (userId) {
        query = query.eq('assigned_to', userId);
      } else {
        // Non-admin users only see their own tasks
        if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
          query = query.eq('assigned_to', currentUser.id);
        }
      }

      const { data: overdueTasks, error } = await query;

      if (error) {
        throw new ApiError('Failed to fetch overdue tasks', 500);
      }

      // Format the data to match expected structure
      const formattedTasks = overdueTasks.map(task => ({
        ...task,
        lead_name: task.leads?.name,
        assigned_first_name: task.assigned_user?.first_name,
        assigned_last_name: task.assigned_user?.last_name,
        // Remove the nested objects
        leads: undefined,
        assigned_user: undefined
      }));

      return formattedTasks || [];
    } catch (error) {
      throw new ApiError('Failed to fetch overdue tasks', 500);
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(currentUser, userId = null) {
    try {
      const supabase = supabaseAdmin;

      let query = supabase
        .from('tasks')
        .select('status, due_date')
        .eq('company_id', currentUser.company_id);

      // If userId is provided, filter by assigned user
      if (userId) {
        query = query.eq('assigned_to', userId);
      } else {
        // Non-admin users only see their own tasks
        if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
          query = query.eq('assigned_to', currentUser.id);
        }
      }

      const { data: tasks, error } = await query;

      if (error) {
        console.error('TaskService.getTaskStats error:', error);
        throw new ApiError('Failed to fetch task statistics', 500);
      }

      const now = new Date();
      const total = tasks.length;
      const pending = tasks.filter(task => task.status === 'pending').length;
      const completed = tasks.filter(task => task.status === 'completed').length;
      const overdue = tasks.filter(task =>
        task.due_date &&
        new Date(task.due_date) < now &&
        task.status !== 'completed'
      ).length;

      return {
        total,
        pending,
        completed,
        overdue
      };
    } catch (error) {
      console.error('TaskService.getTaskStats error:', error);
      throw new ApiError('Failed to fetch task statistics', 500);
    }
  }

  /**
   * Get tasks by lead ID
   */
  async getTasksByLeadId(leadId, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name),
          created_user:user_profiles!tasks_created_by_fkey(first_name, last_name)
        `)
        .eq('lead_id', leadId)
        .eq('company_id', currentUser.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new ApiError('Failed to fetch lead tasks', 500);
      }

      // Format the data to match expected structure
      const formattedTasks = tasks.map(task => ({
        ...task,
        assigned_first_name: task.assigned_user?.first_name,
        assigned_last_name: task.assigned_user?.last_name,
        created_first_name: task.created_user?.first_name,
        created_last_name: task.created_user?.last_name,
        // Remove the nested objects
        assigned_user: undefined,
        created_user: undefined
      }));

      return formattedTasks || [];
    } catch (error) {
      throw new ApiError('Failed to fetch lead tasks', 500);
    }
  }
}

module.exports = new TaskService();
