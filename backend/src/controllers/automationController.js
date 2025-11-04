const automationService = require('../services/automationService');
const ApiError = require('../utils/ApiError');

/**
 * Automation Controller
 * Handles email sequences and automation rules
 */
class AutomationController {
  /**
   * Get all sequences
   * GET /api/automation/sequences
   */
  async getSequences(req, res, next) {
    try {
      const { is_active } = req.query;
      
      const sequences = await automationService.getSequences(req.user, {
        is_active: is_active !== undefined ? is_active === 'true' : undefined
      });

      res.json({
        success: true,
        data: sequences
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sequence by ID
   * GET /api/automation/sequences/:id
   */
  async getSequenceById(req, res, next) {
    try {
      const { id } = req.params;
      const sequence = await automationService.getSequenceById(id, req.user);

      res.json({
        success: true,
        data: sequence
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create sequence
   * POST /api/automation/sequences
   */
  async createSequence(req, res, next) {
    try {
      const sequence = await automationService.createSequence(req.body, req.user);

      res.status(201).json({
        success: true,
        data: sequence,
        message: 'Sequence created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sequence
   * PUT /api/automation/sequences/:id
   */
  async updateSequence(req, res, next) {
    try {
      const { id } = req.params;
      const sequence = await automationService.updateSequence(id, req.body, req.user);

      res.json({
        success: true,
        data: sequence,
        message: 'Sequence updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete sequence
   * DELETE /api/automation/sequences/:id
   */
  async deleteSequence(req, res, next) {
    try {
      const { id } = req.params;
      await automationService.deleteSequence(id, req.user);

      res.json({
        success: true,
        message: 'Sequence deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enroll lead in sequence
   * POST /api/automation/sequences/:id/enroll
   */
  async enrollLead(req, res, next) {
    try {
      const { id } = req.params;
      const { lead_id } = req.body;

      if (!lead_id) {
        throw new ApiError('lead_id is required', 400);
      }

      const enrollment = await automationService.enrollLead(id, lead_id, req.user);

      res.status(201).json({
        success: true,
        data: enrollment,
        message: 'Lead enrolled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unenroll lead from sequence
   * POST /api/automation/enrollments/:enrollmentId/unenroll
   */
  async unenrollLead(req, res, next) {
    try {
      const { enrollmentId } = req.params;
      const { reason } = req.body;

      await automationService.unenrollLead(enrollmentId, reason || 'manual', req.user);

      res.json({
        success: true,
        message: 'Lead unenrolled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get enrollments for a sequence
   * GET /api/automation/sequences/:id/enrollments
   */
  async getEnrollments(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const enrollments = await automationService.getEnrollments(id, req.user, { status });

      res.json({
        success: true,
        data: enrollments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process due enrollments (called by cron)
   * POST /api/automation/process
   */
  async processDueEnrollments(req, res, next) {
    try {
      // This endpoint should be protected or called internally only
      const results = await automationService.processDueEnrollments();

      res.json({
        success: true,
        data: results,
        message: `Processed ${results.length} enrollments`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AutomationController();

