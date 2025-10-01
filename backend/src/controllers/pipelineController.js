const pipelineService = require('../services/pipelineService');
const ApiError = require('../utils/ApiError');

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
}

module.exports = new PipelineController();
