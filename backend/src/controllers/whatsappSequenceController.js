const whatsappSequenceService = require('../services/whatsappSequenceService');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Sequence Controller
 * Handles API endpoints for WhatsApp campaign sequences
 */
class WhatsAppSequenceController {
  /**
   * Get all sequences
   * GET /api/whatsapp/sequences
   */
  async getSequences(req, res, next) {
    try {
      const { is_active, search } = req.query;
      const result = await whatsappSequenceService.getSequences(req.user.company_id, {
        isActive: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        search
      });

      res.json({
        success: true,
        data: result.sequences
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sequence by ID
   * GET /api/whatsapp/sequences/:id
   */
  async getSequenceById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await whatsappSequenceService.getSequenceById(id, req.user.company_id);

      res.json({
        success: true,
        data: result.sequence
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create sequence
   * POST /api/whatsapp/sequences
   */
  async createSequence(req, res, next) {
    try {
      const result = await whatsappSequenceService.createSequence(
        req.body,
        req.user.company_id,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: result.sequence
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sequence
   * PUT /api/whatsapp/sequences/:id
   */
  async updateSequence(req, res, next) {
    try {
      const { id } = req.params;
      const result = await whatsappSequenceService.updateSequence(
        id,
        req.body,
        req.user.company_id
      );

      res.json({
        success: true,
        data: result.sequence
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete sequence
   * DELETE /api/whatsapp/sequences/:id
   */
  async deleteSequence(req, res, next) {
    try {
      const { id } = req.params;
      await whatsappSequenceService.deleteSequence(id, req.user.company_id);

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
   * POST /api/whatsapp/sequences/:id/enroll
   */
  async enrollLead(req, res, next) {
    try {
      const { id } = req.params;
      const { lead_id } = req.body;

      if (!lead_id) {
        throw new ApiError('Lead ID is required', 400);
      }

      const result = await whatsappSequenceService.enrollLead(
        id,
        lead_id,
        req.user.company_id,
        req.user.id
      );

      res.json({
        success: true,
        data: result.enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unenroll lead from sequence
   * POST /api/whatsapp/sequences/:id/unenroll
   */
  async unenrollLead(req, res, next) {
    try {
      const { id } = req.params;
      const { lead_id } = req.body;

      if (!lead_id) {
        throw new ApiError('Lead ID is required', 400);
      }

      await whatsappSequenceService.unenrollLead(id, lead_id);

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
   * GET /api/whatsapp/sequences/:id/enrollments
   */
  async getEnrollments(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const { data, error } = await require('../config/supabase').supabaseAdmin
        .from('whatsapp_sequence_enrollments')
        .select(`
          *,
          lead:leads(id, first_name, last_name, email, phone, status)
        `)
        .eq('sequence_id', id)
        .eq(status ? 'status' : 'id', status || 'id', status ? status : '!=', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WhatsAppSequenceController();

