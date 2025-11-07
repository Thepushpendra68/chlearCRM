const taskService = require('../services/taskService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

const buildTaskSummary = (task = {}) =>
  task.title || task.id || 'Task';

const computeTaskChanges = (before = {}, after = {}) => {
  const fields = [
    'title',
    'description',
    'due_date',
    'priority',
    'status',
    'task_type',
    'assigned_to',
    'lead_id'
  ];

  return fields.reduce((changes, field) => {
    const beforeValue = before[field] ?? null;
    const afterValue = after[field] ?? null;

    if (beforeValue !== afterValue) {
      changes.push({ field, before: beforeValue, after: afterValue });
    }

    return changes;
  }, []);
};

class TaskController {
  /**
   * Get tasks with filters
   */
  async getTasks(req, res, next) {
    try {
      const filters = {
        assigned_to: req.query.assigned_to,
        lead_id: req.query.lead_id,
        account_id: req.query.account_id,
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

      await logAuditEvent(req, {
        action: AuditActions.TASK_CREATED,
        resourceType: 'task',
        resourceId: task.id,
        resourceName: buildTaskSummary(task),
        companyId: task.company_id,
        details: {
          lead_id: task.lead_id,
          account_id: task.account_id,
          assigned_to: task.assigned_to,
          due_date: task.due_date,
          priority: task.priority,
          status: task.status,
          task_type: task.task_type
        }
      });
      
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

      const result = await taskService.updateTask(id, updateData, req.user);

      const { previousTask, updatedTask } = result;
      const changes = computeTaskChanges(previousTask, updatedTask);

      if (changes.length > 0) {
        await logAuditEvent(req, {
          action: AuditActions.TASK_UPDATED,
          resourceType: 'task',
          resourceId: updatedTask.id,
          resourceName: buildTaskSummary(updatedTask),
          companyId: updatedTask.company_id,
          details: { changes }
        });

        const statusChange = changes.find(change => change.field === 'status');
        if (statusChange && statusChange.after === 'completed') {
          await logAuditEvent(req, {
            action: AuditActions.TASK_COMPLETED,
            resourceType: 'task',
            resourceId: updatedTask.id,
            resourceName: buildTaskSummary(updatedTask),
            companyId: updatedTask.company_id,
            details: {
              from: statusChange.before,
              to: statusChange.after
            }
          });
        }
      }
      
      res.json({
        success: true,
        data: updatedTask,
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
      const result = await taskService.completeTask(id, req.user.id, req.user);

      await logAuditEvent(req, {
        action: AuditActions.TASK_COMPLETED,
        resourceType: 'task',
        resourceId: result.updatedTask.id,
        resourceName: buildTaskSummary(result.updatedTask),
        companyId: result.updatedTask.company_id,
        severity: AuditSeverity.INFO,
        details: {
          completed_by: req.user.id,
          previous_status: result.previousTask.status
        }
      });
      
      res.json({
        success: true,
        data: result.updatedTask,
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
      const result = await taskService.deleteTask(id, req.user);

      if (!result?.success) {
        throw new ApiError('Task not found', 404);
      }

      await logAuditEvent(req, {
        action: AuditActions.TASK_DELETED,
        resourceType: 'task',
        resourceId: id,
        resourceName: buildTaskSummary(result.deletedTask || { id }),
        companyId: result.deletedTask?.company_id ?? req.user.company_id,
        severity: AuditSeverity.WARNING,
        details: {
          lead_id: result.deletedTask?.lead_id ?? null,
          assigned_to: result.deletedTask?.assigned_to ?? null
        }
      });
      
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
