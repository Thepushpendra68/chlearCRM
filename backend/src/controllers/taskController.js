const taskService = require('../services/taskService');
const ApiError = require('../utils/ApiError');

class TaskController {
  /**
   * Get tasks with filters
   */
  async getTasks(req, res, next) {
    try {
      const filters = {
        assigned_to: req.query.assigned_to,
        lead_id: req.query.lead_id,
        status: req.query.status,
        priority: req.query.priority,
        task_type: req.query.task_type,
        due_date_from: req.query.due_date_from,
        due_date_to: req.query.due_date_to,
        overdue: req.query.overdue === 'true'
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const tasks = await taskService.getTasks(req.user, filters);
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id, req.user);
      
      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new task
   */
  async createTask(req, res, next) {
    try {
      const taskData = {
        ...req.body,
        created_by: req.user.id
      };

      const task = await taskService.createTask(taskData, req.user);
      
      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update task
   */
  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const task = await taskService.updateTask(id, updateData, req.user);
      
      res.json({
        success: true,
        data: task,
        message: 'Task updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(req, res, next) {
    try {
      const { id } = req.params;
      const task = await taskService.completeTask(id, req.user.id, req.user);
      
      res.json({
        success: true,
        data: task,
        message: 'Task completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete task
   */
  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      await taskService.deleteTask(id, req.user);
      
      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(req, res, next) {
    try {
      const userId = req.query.user_id || null;
      const overdueTasks = await taskService.getOverdueTasks(req.user, userId);
      
      res.json({
        success: true,
        data: overdueTasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(req, res, next) {
    try {
      const userId = req.query.user_id || null;
      const stats = await taskService.getTaskStats(req.user, userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tasks by lead ID
   */
  async getTasksByLeadId(req, res, next) {
    try {
      const { leadId } = req.params;
      const tasks = await taskService.getTasksByLeadId(leadId, req.user);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
