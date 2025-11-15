const pipelineService = require('../services/pipelineService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Pipeline Controller
 * Handles all pipeline-related operations
 * Extends BaseController for standardized patterns
 */
class PipelineController extends BaseController {
  /**
   * Build stage description for logging
   */
  describeStage(stage = {}) {
    return stage?.name || `Stage ${stage?.id || ''}`.trim();
  }

  /**
   * Compute changes between stage states
   */
  computeStageChanges(before = {}, after = {}) {
    const fields = [
      'name',
      'color',
      'order_position',
      'is_active',
      'is_closed_won',
      'is_closed_lost'
    ];

    return fields.reduce((changes, field) => {
      const beforeVal = before[field] ?? null;
      const afterVal = after[field] ?? null;
      if (beforeVal !== afterVal) {
        changes.push({ field, before: beforeVal, after: afterVal });
      }
      return changes;
    }, []);
  }
  // Get all pipeline stages
  getStages = asyncHandler(async (req, res) => {
    const result = await pipelineService.getAllStages(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Pipeline stages retrieved successfully');
  });

  // Create new pipeline stage
  createStage = asyncHandler(async (req, res) => {
    const { name, color, order_position } = req.body;

    const result = await pipelineService.createStage({
      name,
      color,
      order_position
    }, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.PIPELINE_STAGE_CREATED,
      resourceType: 'pipeline_stage',
      resourceId: result.data?.id,
      resourceName: this.describeStage(result.data),
      companyId: req.user.company_id,
      details: {
        color: result.data?.color,
        order_position: result.data?.order_position
      }
    });

    this.created(res, result.data, 'Pipeline stage created successfully');
  });

  // Update pipeline stage
  updateStage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const result = await pipelineService.updateStage(id, updateData, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    const changes = this.computeStageChanges(result.previousStage, result.data);
    if (changes.length > 0) {
      await logAuditEvent(req, {
        action: AuditActions.PIPELINE_STAGE_UPDATED,
        resourceType: 'pipeline_stage',
        resourceId: result.data?.id,
        resourceName: this.describeStage(result.data),
        companyId: req.user.company_id,
        details: { changes }
      });
    }

    this.updated(res, result.data, 'Pipeline stage updated successfully');
  });

  // Delete pipeline stage
  deleteStage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pipelineService.deleteStage(id, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.PIPELINE_STAGE_DELETED,
      resourceType: 'pipeline_stage',
      resourceId: id,
      resourceName: this.describeStage(result.deletedStage || { id }),
      companyId: req.user.company_id,
      severity: AuditSeverity.WARNING
    });

    this.deleted(res, result.message);
  });

  // Reorder pipeline stages
  reorderStages = asyncHandler(async (req, res) => {
    const { stageOrders } = req.body;

    const result = await pipelineService.reorderStages(stageOrders, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.PIPELINE_STAGE_REORDERED,
      resourceType: 'pipeline_stage',
      resourceName: 'Pipeline stages',
      companyId: req.user.company_id,
      details: {
        stage_orders: stageOrders
      }
    });

    this.success(res, result.data, 200, 'Pipeline stages reordered successfully');
  });

  // Get pipeline overview
  getPipelineOverview = asyncHandler(async (req, res) => {
    const result = await pipelineService.getPipelineOverview(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Pipeline overview retrieved successfully');
  });

  // Move lead to different stage
  moveLeadToStage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stage_id } = req.body;
    const userId = req.user.id;

    const result = await pipelineService.moveLeadToStage(id, stage_id, userId, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.PIPELINE_LEAD_MOVED,
      resourceType: 'lead',
      resourceId: id,
      resourceName: `Lead ${id}`,
      companyId: req.user.company_id,
      details: {
        from_stage_id: result.data.previous_stage_id,
        to_stage_id: result.data.new_stage_id,
        from_stage_name: this.describeStage(result.previousStage),
        to_stage_name: this.describeStage(result.newStage)
      }
    });

    this.success(res, result.data, 200, 'Lead moved to new stage successfully');
  });

  // Get conversion rates
  getConversionRates = asyncHandler(async (req, res) => {
    const result = await pipelineService.getConversionRates(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Conversion rates retrieved successfully');
  });

  // Create default pipeline stages
  createDefaultStages = asyncHandler(async (req, res) => {
    const result = await pipelineService.createDefaultStages(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.PIPELINE_STAGE_CREATED,
      resourceType: 'pipeline_stage',
      resourceName: 'Default pipeline stages',
      companyId: req.user.company_id,
      details: {
        created_stage_ids: result.data?.map(stage => stage.id),
        count: result.data?.length || 0
      }
    });

    this.created(res, result.data, 'Default pipeline stages created successfully');
  });
}

module.exports = new PipelineController();
