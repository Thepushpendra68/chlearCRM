const db = require('../config/database');
const ApiError = require('../utils/ApiError');

class TaskService {
  /**
   * Get tasks with filters
   */
  async getTasks(filters = {}) {
    try {
      let query = db('tasks')
        .select(
          'tasks.*',
          db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name'),
          'leads.email as lead_email',
          'assigned_user.first_name as assigned_first_name',
          'assigned_user.last_name as assigned_last_name',
          'assigned_user.email as assigned_email',
          'created_user.first_name as created_first_name',
          'created_user.last_name as created_last_name'
        )
        .leftJoin('leads', 'tasks.lead_id', 'leads.id')
        .leftJoin('users as assigned_user', 'tasks.assigned_to', 'assigned_user.id')
        .leftJoin('users as created_user', 'tasks.created_by', 'created_user.id')
        .limit(100); // Add limit to prevent large result sets

      // Apply filters
      if (filters.assigned_to) {
        query = query.where('tasks.assigned_to', filters.assigned_to);
      }

      if (filters.lead_id) {
        query = query.where('tasks.lead_id', filters.lead_id);
      }

      if (filters.status) {
        query = query.where('tasks.status', filters.status);
      }

      if (filters.priority) {
        query = query.where('tasks.priority', filters.priority);
      }

      if (filters.task_type) {
        query = query.where('tasks.task_type', filters.task_type);
      }

      if (filters.due_date_from) {
        query = query.where('tasks.due_date', '>=', filters.due_date_from);
      }

      if (filters.due_date_to) {
        query = query.where('tasks.due_date', '<=', filters.due_date_to);
      }

      if (filters.overdue) {
        query = query.where('tasks.due_date', '<', new Date())
          .where('tasks.status', '!=', 'completed');
      }

      // Order by due date and priority
      query = query.orderBy('tasks.due_date', 'asc')
        .orderBy('tasks.priority', 'desc')
        .orderBy('tasks.created_at', 'desc');

      const tasks = await query;
      return tasks;
    } catch (error) {
      console.error('TaskService.getTasks error:', error);
      throw new ApiError('Failed to fetch tasks', 500);
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId) {
    try {
      const task = await db('tasks')
        .select(
          'tasks.*',
          db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name'),
          'leads.email as lead_email',
          'assigned_user.first_name as assigned_first_name',
          'assigned_user.last_name as assigned_last_name',
          'assigned_user.email as assigned_email',
          'created_user.first_name as created_first_name',
          'created_user.last_name as created_last_name'
        )
        .leftJoin('leads', 'tasks.lead_id', 'leads.id')
        .leftJoin('users as assigned_user', 'tasks.assigned_to', 'assigned_user.id')
        .leftJoin('users as created_user', 'tasks.created_by', 'created_user.id')
        .where('tasks.id', taskId)
        .first();

      if (!task) {
        throw new ApiError('Task not found', 404);
      }

      return task;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch task', 500);
    }
  }

  /**
   * Create new task
   */
  async createTask(taskData) {
    try {
      const [task] = await db('tasks')
        .insert({
          lead_id: taskData.lead_id || null,
          assigned_to: taskData.assigned_to,
          created_by: taskData.created_by,
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.due_date || null,
          priority: taskData.priority || 'medium',
          status: taskData.status || 'pending',
          task_type: taskData.task_type || 'follow_up'
        })
        .returning('*');

      return task;
    } catch (error) {
      console.error('Task creation error:', error);
      throw new ApiError('Failed to create task', 500);
    }
  }

  /**
   * Update task
   */
  async updateTask(taskId, updateData) {
    try {
      // Handle empty strings for foreign key fields
      const cleanedData = {
        ...updateData,
        lead_id: updateData.lead_id || null,
        due_date: updateData.due_date || null,
        updated_at: new Date()
      };

      const [task] = await db('tasks')
        .where('id', taskId)
        .update(cleanedData)
        .returning('*');

      if (!task) {
        throw new ApiError('Task not found', 404);
      }

      return task;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Task update error:', error);
      throw new ApiError('Failed to update task', 500);
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId, userId) {
    try {
      const [task] = await db('tasks')
        .where('id', taskId)
        .update({
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      if (!task) {
        throw new ApiError('Task not found', 404);
      }

      return task;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to complete task', 500);
    }
  }

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    try {
      const deleted = await db('tasks')
        .where('id', taskId)
        .del();

      if (deleted === 0) {
        throw new ApiError('Task not found', 404);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete task', 500);
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId = null) {
    try {
      let query = db('tasks')
        .select(
          'tasks.*',
          db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name'),
          'leads.email as lead_email',
          'assigned_user.first_name as assigned_first_name',
          'assigned_user.last_name as assigned_last_name'
        )
        .leftJoin('leads', 'tasks.lead_id', 'leads.id')
        .leftJoin('users as assigned_user', 'tasks.assigned_to', 'assigned_user.id')
        .where('tasks.due_date', '<', new Date())
        .where('tasks.status', '!=', 'completed')
        .orderBy('tasks.due_date', 'asc');

      if (userId) {
        query = query.where('tasks.assigned_to', userId);
      }

      const overdueTasks = await query;
      return overdueTasks;
    } catch (error) {
      throw new ApiError('Failed to fetch overdue tasks', 500);
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(userId = null) {
    try {
      // Use a single query with conditional aggregation to avoid connection pool exhaustion
      let query = db('tasks')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending', ['pending']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed', ['completed']),
          db.raw('COUNT(CASE WHEN due_date < ? AND status != ? THEN 1 END) as overdue', [new Date(), 'completed'])
        );

      if (userId) {
        query = query.where('assigned_to', userId);
      }

      const result = await query.first();

      return {
        total: parseInt(result.total),
        pending: parseInt(result.pending),
        completed: parseInt(result.completed),
        overdue: parseInt(result.overdue)
      };
    } catch (error) {
      console.error('TaskService.getTaskStats error:', error);
      throw new ApiError('Failed to fetch task statistics', 500);
    }
  }

  /**
   * Get tasks by lead ID
   */
  async getTasksByLeadId(leadId) {
    try {
      const tasks = await db('tasks')
        .select(
          'tasks.*',
          'assigned_user.first_name as assigned_first_name',
          'assigned_user.last_name as assigned_last_name',
          'created_user.first_name as created_first_name',
          'created_user.last_name as created_last_name'
        )
        .leftJoin('users as assigned_user', 'tasks.assigned_to', 'assigned_user.id')
        .leftJoin('users as created_user', 'tasks.created_by', 'created_user.id')
        .where('tasks.lead_id', leadId)
        .orderBy('tasks.created_at', 'desc');

      return tasks;
    } catch (error) {
      throw new ApiError('Failed to fetch lead tasks', 500);
    }
  }
}

module.exports = new TaskService();
