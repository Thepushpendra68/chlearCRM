const activityService = require('../services/activityService');
const timelineService = require('../services/timelineService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

const buildActivitySummary = (activity = {}) => {
  if (!activity) return 'Activity';
  const base = activity.subject || activity.activity_type || activity.type || 'Activity';
  return activity.lead_id ? `${base} for lead ${activity.lead_id}` : base;
};

const computeActivityChanges = (before = {}, after = {}) => {
  const fields = [
    'subject',
    'description',
    'activity_type',
    'scheduled_at',
    'completed_at',
    'is_completed',
    'duration_minutes',
    'outcome',
    'user_id',
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

class ActivityController {
  // Get activities with filters
  async getActivities(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
      const userSpecific = req.query.user_specific === 'true';

      const filters = {
        lead_id: req.query.lead_id,
        account_id: req.query.account_id,
        user_id: req.query.user_id,
        activity_type: req.query.activity_type,
        is_completed: req.query.is_completed ? req.query.is_completed === 'true' : undefined,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        scheduled_from: req.query.scheduled_from,
        scheduled_to: req.query.scheduled_to,
        limit,
        offset,
        page,
        user_specific: userSpecific
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await activityService.getActivities(req.user, filters);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get activity by ID
  async getActivityById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await activityService.getActivityById(id, req.user);

      if (!result.success) {
        throw new ApiError(404, result.error);
      }

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new activity
  async createActivity(req, res, next) {
    try {
      const activityData = {
        ...req.body,
        user_id: req.user.id // Set from authenticated user
      };

      const result = await activityService.createActivity(activityData, req.user);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      await logAuditEvent(req, {
        action: AuditActions.ACTIVITY_LOGGED,
        resourceType: 'activity',
        resourceId: result.data?.id,
        resourceName: buildActivitySummary(result.data),
        companyId: result.data?.company_id,
        details: {
          activity_type: result.data?.activity_type,
          lead_id: result.data?.lead_id,
          account_id: result.data?.account_id,
          user_id: result.data?.user_id,
          scheduled_at: result.data?.scheduled_at,
          is_completed: result.data?.is_completed
        }
      });

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Activity created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update activity
  async updateActivity(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await activityService.updateActivity(id, updateData, req.user);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      const changes = computeActivityChanges(result.previousActivity, result.data);
      if (changes.length > 0) {
        await logAuditEvent(req, {
          action: AuditActions.ACTIVITY_UPDATED,
          resourceType: 'activity',
          resourceId: result.data?.id,
          resourceName: buildActivitySummary(result.data),
          companyId: result.data?.company_id,
          details: { changes }
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Activity updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete activity
  async deleteActivity(req, res, next) {
    try {
      const { id } = req.params;

      const result = await activityService.deleteActivity(id, req.user);

      if (!result.success) {
        throw new ApiError(404, result.error);
      }

      await logAuditEvent(req, {
        action: AuditActions.ACTIVITY_DELETED,
        resourceType: 'activity',
        resourceId: id,
        resourceName: buildActivitySummary(result.deletedActivity || { id }),
        companyId: result.deletedActivity?.company_id ?? req.user.company_id,
        severity: AuditSeverity.WARNING,
        details: {
          activity_type: result.deletedActivity?.activity_type,
          lead_id: result.deletedActivity?.lead_id,
          user_id: result.deletedActivity?.user_id
        }
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark activity as completed
  async completeActivity(req, res, next) {
    try {
      const { id } = req.params;
      const completionData = req.body;

      const result = await activityService.completeActivity(id, completionData, req.user);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      await logAuditEvent(req, {
        action: AuditActions.ACTIVITY_UPDATED,
        resourceType: 'activity',
        resourceId: result.data?.id,
        resourceName: buildActivitySummary(result.data),
        companyId: result.data?.company_id,
        severity: AuditSeverity.INFO,
        details: {
          completed_at: result.data?.completed_at,
          outcome: result.data?.outcome,
          duration_minutes: result.data?.duration_minutes
        }
      });

      res.json({
        success: true,
        data: result.data,
        message: 'Activity marked as completed'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get lead timeline
  async getLeadTimeline(req, res, next) {
    try {
      const { id } = req.params;
      const options = {
        includeActivities: req.query.include_activities !== 'false',
        includeStageChanges: req.query.include_stage_changes !== 'false',
        includeAssignments: req.query.include_assignments !== 'false',
        limit: req.query.limit ? parseInt(req.query.limit) : 100,
        dateFrom: req.query.date_from,
        dateTo: req.query.date_to
      };

      const result = await timelineService.getLeadTimeline(id, options);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get lead activities (simplified version)
  async getLeadActivities(req, res, next) {
    try {
      const { id } = req.params;
      const filters = {
        lead_id: id,
        limit: req.query.limit ? parseInt(req.query.limit) : 50
      };

      const result = await activityService.getActivities(req.user, filters);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's activities
  async getUserActivities(req, res, next) {
    try {
      const { id } = req.params;
      const filters = {
        user_id: id,
        activity_type: req.query.activity_type,
        is_completed: req.query.is_completed ? req.query.is_completed === 'true' : undefined,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await activityService.getUserActivities(id, filters);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Create multiple activities (bulk)
  async createBulkActivities(req, res, next) {
    try {
      const { activities } = req.body;

      if (!Array.isArray(activities) || activities.length === 0) {
        throw new ApiError(400, 'Activities array is required and must not be empty');
      }

      // Set user_id for all activities
      const activitiesWithUser = activities.map(activity => ({
        ...activity,
        user_id: req.user.id
      }));

      const result = await activityService.createBulkActivities(activitiesWithUser, req.user);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: `${result.data.created_count} activities created successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  // Get activity statistics
  async getActivityStats(req, res, next) {
    try {
      const filters = {
        user_id: req.query.user_id,
        lead_id: req.query.lead_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await activityService.getActivityStats(filters);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get timeline summary for a lead
  async getLeadTimelineSummary(req, res, next) {
    try {
      const { id } = req.params;

      const result = await timelineService.getLeadTimelineSummary(id);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user timeline
  async getUserTimeline(req, res, next) {
    try {
      const { id } = req.params;
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        dateFrom: req.query.date_from,
        dateTo: req.query.date_to,
        activityTypes: req.query.activity_types ? req.query.activity_types.split(',') : null
      };

      const result = await timelineService.getUserTimeline(id, options);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get team timeline
  async getTeamTimeline(req, res, next) {
    try {
      const { user_ids } = req.query;

      if (!user_ids) {
        throw new ApiError(400, 'user_ids parameter is required');
      }

      const teamUserIds = user_ids.split(',');
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : 100,
        dateFrom: req.query.date_from,
        dateTo: req.query.date_to,
        activityTypes: req.query.activity_types ? req.query.activity_types.split(',') : null
      };

      const result = await timelineService.getTeamTimeline(teamUserIds, options);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get activity trends
  async getActivityTrends(req, res, next) {
    try {
      const filters = {
        user_id: req.query.user_id,
        lead_id: req.query.lead_id,
        dateFrom: req.query.date_from,
        dateTo: req.query.date_to,
        groupBy: req.query.group_by || 'day'
      };

      const result = await timelineService.getActivityTrends(filters);

      if (!result.success) {
        throw new ApiError(result.error, 400);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityController();
