const automationService = require('../services/automationService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Automation Controller
 * Handles email sequences and automation rules
 * Extends BaseController for standardized patterns
 */
class AutomationController extends BaseController {
  /**
   * Get all sequences
   * GET /api/automation/sequences
   */
  getSequences = asyncHandler(async (req, res) => {
    const { is_active } = req.query;

    const sequences = await automationService.getSequences(req.user, {
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    });

    this.success(res, sequences, 200);
  });

  /**
   * Get sequence by ID
   * GET /api/automation/sequences/:id
   */
  getSequenceById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sequence = await automationService.getSequenceById(id, req.user);

    this.success(res, sequence, 200);
  });

  /**
   * Create sequence
   * POST /api/automation/sequences
   */
  createSequence = asyncHandler(async (req, res) => {
    const sequence = await automationService.createSequence(req.body, req.user);

    this.created(res, sequence, 'Sequence created successfully');
  });

  /**
   * Update sequence
   * PUT /api/automation/sequences/:id
   */
  updateSequence = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sequence = await automationService.updateSequence(id, req.body, req.user);

    this.success(res, sequence, 200, 'Sequence updated successfully');
  });

  /**
   * Delete sequence
   * DELETE /api/automation/sequences/:id
   */
  deleteSequence = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await automationService.deleteSequence(id, req.user);

    this.success(res, null, 200, 'Sequence deleted successfully');
  });

  /**
   * Enroll lead in sequence
   * POST /api/automation/sequences/:id/enroll
   */
  enrollLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lead_id } = req.body;

    if (!lead_id) {
      throw new ApiError('lead_id is required', 400);
    }

    const enrollment = await automationService.enrollLead(id, lead_id, req.user);

    this.created(res, enrollment, 'Lead enrolled successfully');
  });

  /**
   * Unenroll lead from sequence
   * POST /api/automation/enrollments/:enrollmentId/unenroll
   */
  unenrollLead = asyncHandler(async (req, res) => {
    const { enrollmentId } = req.params;
    const { reason } = req.body;

    await automationService.unenrollLead(enrollmentId, reason || 'manual', req.user);

    this.success(res, null, 200, 'Lead unenrolled successfully');
  });

  /**
   * Get enrollments for a sequence
   * GET /api/automation/sequences/:id/enrollments
   */
  getEnrollments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.query;

    const enrollments = await automationService.getEnrollments(id, req.user, { status });

    this.success(res, enrollments, 200);
  });

  /**
   * Process due enrollments (called by cron)
   * POST /api/automation/process
   */
  processDueEnrollments = asyncHandler(async (req, res) => {
    // This endpoint should be protected or called internally only
    const results = await automationService.processDueEnrollments();

    this.success(res, results, 200, `Processed ${results.length} enrollments`);
  });
}

module.exports = new AutomationController();

