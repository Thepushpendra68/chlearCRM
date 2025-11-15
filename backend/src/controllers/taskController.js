const taskService = require('../services/taskService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Task Controller
 * Handles all task-related operations
 * Extends BaseController for standardized patterns
 */
class TaskController extends BaseController {
  /**
   * Build task summary for logging
   */
  buildTaskSummary(task = {}) {
    return task.title || task.id || 'Task';
  }

  /**
   * Compute changes between task states
   */
  computeTaskChanges(before = {}, after = {}) {
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
  }
  /**
   * Get tasks with filters
   */
  getTasks = asyncHandler(async (req, res) => {
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
    this.success(res, tasks, 200, 'Tasks retrieved successfully');
  });

  /**
   * Get task by ID
   */
  getTaskById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const task = await taskService.getTaskById(id, req.user);

    if (!task) {
      return this.notFound(res, 'Task not found');
    }

    this.success(res, task, 200, 'Task retrieved successfully');
  });

  /**
   * Create new task
   */
  createTask = asyncHandler(async (req, res) => {
    const taskData = {
      ...req.body,
      created_by: req.user.id
    };

    const task = await taskService.createTask(taskData, req.user);

    await logAuditEvent(req, {
      action: AuditActions.TASK_CREATED,
      resourceType: 'task',
      resourceId: task.id,
      resourceName: this.buildTaskSummary(task),
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

    this.created(res, task, 'Task created successfully');
  });

  /**
   * Update task
   */
  updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const result = await taskService.updateTask(id, updateData, req.user);

    const { previousTask, updatedTask } = result;
    const changes = this.computeTaskChanges(previousTask, updatedTask);

    if (changes.length > 0) {
      await logAuditEvent(req, {
        action: AuditActions.TASK_UPDATED,
        resourceType: 'task',
        resourceId: updatedTask.id,
        resourceName: this.buildTaskSummary(updatedTask),
        companyId: updatedTask.company_id,
        details: { changes }
      });

      const statusChange = changes.find(change => change.field === 'status');
      if (statusChange && statusChange.after === 'completed') {
        await logAuditEvent(req, {
          action: AuditActions.TASK_COMPLETED,
          resourceType: 'task',
          resourceId: updatedTask.id,
          resourceName: this.buildTaskSummary(updatedTask),
          companyId: updatedTask.company_id,
          details: {
            from: statusChange.before,
            to: statusChange.after
          }
        });
      }
    }

    this.updated(res, updatedTask, 'Task updated successfully');
  });

  /**
   * Mark task as completed
   */
  completeTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await taskService.completeTask(id, req.user.id, req.user);

    await logAuditEvent(req, {
      action: AuditActions.TASK_COMPLETED,
      resourceType: 'task',
      resourceId: result.updatedTask.id,
      resourceName: this.buildTaskSummary(result.updatedTask),
      companyId: result.updatedTask.company_id,
      severity: AuditSeverity.INFO,
      details: {
        completed_by: req.user.id,
        previous_status: result.previousTask.status
      }
    });

    this.success(res, result.updatedTask, 200, 'Task completed successfully');
  });

  /**
   * Delete task
   */
  deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await taskService.deleteTask(id, req.user);

    if (!result?.success) {
      return this.notFound(res, 'Task not found');
    }

    await logAuditEvent(req, {
      action: AuditActions.TASK_DELETED,
      resourceType: 'task',
      resourceId: id,
      resourceName: this.buildTaskSummary(result.deletedTask || { id }),
      companyId: result.deletedTask?.company_id ?? req.user.company_id,
      severity: AuditSeverity.WARNING,
      details: {
        lead_id: result.deletedTask?.lead_id ?? null,
        assigned_to: result.deletedTask?.assigned_to ?? null
      }
    });

    this.deleted(res, 'Task deleted successfully');
  });

  /**
   * Get overdue tasks
   */
  getOverdueTasks = asyncHandler(async (req, res) => {
    const userId = req.query.user_id || null;
    const overdueTasks = await taskService.getOverdueTasks(req.user, userId);

    this.success(res, overdueTasks, 200, 'Overdue tasks retrieved successfully');
  });

  /**
   * Get task statistics
   */
  getTaskStats = asyncHandler(async (req, res) => {
    const userId = req.query.user_id || null;
    const stats = await taskService.getTaskStats(req.user, userId);

    this.success(res, stats, 200, 'Task statistics retrieved successfully');
  });

  /**
   * Get tasks by lead ID
   */
  getTasksByLeadId = asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const tasks = await taskService.getTasksByLeadId(leadId, req.user);

    this.success(res, tasks, 200, 'Tasks retrieved successfully');
  });
}

module.exports = new TaskController();
