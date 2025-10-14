const pipelineService = require('../services/pipelineService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

const describeStage = (stage = {}) => stage?.name || `Stage ${stage?.id || ''}`.trim();

const computeStageChanges = (before = {}, after = {}) => {
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
};

class PipelineController {
  // Get all pipeline stages
  async getStages(req, res, next) {
    try {
      const result = await pipelineService.getAllStages(req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new pipeline stage
  async createStage(req, res, next) {
    try {
      const { name, color, order_position } = req.body;

      const result = await pipelineService.createStage({
        name,
        color,
        order_position
      }, req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
      }

      await logAuditEvent(req, {
        action: AuditActions.PIPELINE_STAGE_CREATED,
        resourceType: 'pipeline_stage',
        resourceId: result.data?.id,
        resourceName: describeStage(result.data),
        companyId: req.user.company_id,
        details: {
          color: result.data?.color,
          order_position: result.data?.order_position
        }
      });

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Pipeline stage created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update pipeline stage
  async updateStage(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await pipelineService.updateStage(id, updateData, req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
      }

      const changes = computeStageChanges(result.previousStage, result.data);
      if (changes.length > 0) {
        await logAuditEvent(req, {
          action: AuditActions.PIPELINE_STAGE_UPDATED,
          resourceType: 'pipeline_stage',
          resourceId: result.data?.id,
          resourceName: describeStage(result.data),
          companyId: req.user.company_id,
          details: { changes }
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Pipeline stage updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete pipeline stage
  async deleteStage(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pipelineService.deleteStage(id, req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
      }

      await logAuditEvent(req, {
        action: AuditActions.PIPELINE_STAGE_DELETED,
        resourceType: 'pipeline_stage',
        resourceId: id,
        resourceName: describeStage(result.deletedStage || { id }),
        companyId: req.user.company_id,
        severity: AuditSeverity.WARNING
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Reorder pipeline stages
  async reorderStages(req, res, next) {
    try {
      const { stageOrders } = req.body;

      const result = await pipelineService.reorderStages(stageOrders, req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
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

      res.json({
        success: true,
        data: result.data,
        message: 'Pipeline stages reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get pipeline overview
  async getPipelineOverview(req, res, next) {
    try {
      const result = await pipelineService.getPipelineOverview(req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Move lead to different stage
  async moveLeadToStage(req, res, next) {
    try {
      const { id } = req.params;
      const { stage_id } = req.body;
      const userId = req.user.id;

      const result = await pipelineService.moveLeadToStage(id, stage_id, userId, req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
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
          from_stage_name: describeStage(result.previousStage),
          to_stage_name: describeStage(result.newStage)
        }
      });

      res.json({
        success: true,
        data: result.data,
        message: 'Lead moved to new stage successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get conversion rates
  async getConversionRates(req, res, next) {
    try {
      const result = await pipelineService.getConversionRates(req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Create default pipeline stages
  async createDefaultStages(req, res, next) {
    try {
      const result = await pipelineService.createDefaultStages(req.user);

      if (!result.success) {
        throw new ApiError(400, result.error);
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

      res.status(201).json({
        success: true,
        message: 'Default pipeline stages created successfully',
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PipelineController();
