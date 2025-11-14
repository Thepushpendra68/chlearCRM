const whatsappBroadcastService = require('../services/whatsappBroadcastService');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Broadcast Controller
 * Handles API endpoints for broadcast messaging
 */
class WhatsAppBroadcastController {
  /**
   * Create a new broadcast
   * POST /api/whatsapp/broadcasts
   */
  async createBroadcast(req, res, next) {
    try {
      const broadcastData = {
        ...req.body,
        created_by: req.user.id
      };

      const result = await whatsappBroadcastService.createBroadcast(
        req.user.company_id,
        broadcastData
      );

      res.json({
        success: true,
        data: result.broadcast
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all broadcasts
   * GET /api/whatsapp/broadcasts
   */
  async getBroadcasts(req, res, next) {
    try {
      const filters = {
        status: req.query.status
      };

      const result = await whatsappBroadcastService.getBroadcasts(
        req.user.company_id,
        filters
      );

      res.json({
        success: true,
        data: result.broadcasts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get broadcast by ID
   * GET /api/whatsapp/broadcasts/:id
   */
  async getBroadcastById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await whatsappBroadcastService.getBroadcastById(
        id,
        req.user.company_id
      );

      res.json({
        success: true,
        data: result.broadcast
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send broadcast
   * POST /api/whatsapp/broadcasts/:id/send
   */
  async sendBroadcast(req, res, next) {
    try {
      const { id } = req.params;

      const result = await whatsappBroadcastService.sendBroadcast(id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel broadcast
   * POST /api/whatsapp/broadcasts/:id/cancel
   */
  async cancelBroadcast(req, res, next) {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = require('../config/supabase');

      // Check if broadcast exists and belongs to company
      const { data: broadcast, error: fetchError } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .select('id, status')
        .eq('id', id)
        .eq('company_id', req.user.company_id)
        .single();

      if (fetchError || !broadcast) {
        throw new ApiError('Broadcast not found', 404);
      }

      if (broadcast.status === 'sent' || broadcast.status === 'cancelled') {
        throw new ApiError(`Cannot cancel broadcast with status: ${broadcast.status}`, 400);
      }

      // Update status
      const { error: updateError } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Broadcast cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete broadcast
   * DELETE /api/whatsapp/broadcasts/:id
   */
  async deleteBroadcast(req, res, next) {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = require('../config/supabase');

      // Check if broadcast exists and belongs to company
      const { data: broadcast, error: fetchError } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .select('id, status')
        .eq('id', id)
        .eq('company_id', req.user.company_id)
        .single();

      if (fetchError || !broadcast) {
        throw new ApiError('Broadcast not found', 404);
      }

      if (broadcast.status === 'sending') {
        throw new ApiError('Cannot delete broadcast that is currently sending', 400);
      }

      // Delete broadcast (cascade will delete recipients)
      const { error: deleteError } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      res.json({
        success: true,
        message: 'Broadcast deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get broadcast statistics
   * GET /api/whatsapp/broadcasts/:id/stats
   */
  async getBroadcastStats(req, res, next) {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = require('../config/supabase');

      // Get broadcast
      const { data: broadcast, error: broadcastError } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .select('progress, recipient_count')
        .eq('id', id)
        .eq('company_id', req.user.company_id)
        .single();

      if (broadcastError || !broadcast) {
        throw new ApiError('Broadcast not found', 404);
      }

      // Get recipient status counts
      const { data: recipients, error: recipientsError } = await supabaseAdmin
        .from('whatsapp_broadcast_recipients')
        .select('status')
        .eq('broadcast_id', id);

      if (recipientsError) throw recipientsError;

      const stats = {
        total: broadcast.recipient_count || 0,
        sent: recipients.filter(r => r.status === 'sent').length,
        delivered: recipients.filter(r => r.status === 'delivered').length,
        read: recipients.filter(r => r.status === 'read').length,
        failed: recipients.filter(r => r.status === 'failed').length,
        pending: recipients.filter(r => r.status === 'pending').length,
        skipped: recipients.filter(r => r.status === 'skipped').length
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WhatsAppBroadcastController();

