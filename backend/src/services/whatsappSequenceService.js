const { supabaseAdmin } = require('../config/supabase');
const whatsappSendService = require('./whatsappSendService');
const leadService = require('./leadService');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Sequence Service
 * Manages automated WhatsApp message sequences (campaigns)
 */
class WhatsAppSequenceService {
  /**
   * Get all sequences for a company
   */
  async getSequences(companyId, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('whatsapp_sequences')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, sequences: data || [] };
    } catch (error) {
      console.error('Error getting WhatsApp sequences:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to get sequences', 500);
    }
  }

  /**
   * Get sequence by ID
   */
  async getSequenceById(sequenceId, companyId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_sequences')
        .select('*')
        .eq('id', sequenceId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      if (!data) throw new ApiError('Sequence not found', 404);

      return { success: true, sequence: data };
    } catch (error) {
      console.error('Error getting sequence:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to get sequence', 500);
    }
  }

  /**
   * Create a new sequence
   */
  async createSequence(sequenceData, companyId, userId) {
    try {
      const {
        name,
        description,
        json_definition,
        entry_conditions,
        exit_on_reply = true,
        exit_on_goal,
        is_active = false,
        send_time_window,
        max_messages_per_day = 5
      } = sequenceData;

      if (!name || !json_definition) {
        throw new ApiError('Name and workflow definition are required', 400);
      }

      // Validate JSON definition structure
      if (!json_definition.steps || !Array.isArray(json_definition.steps)) {
        throw new ApiError('Workflow definition must have a steps array', 400);
      }

      const { data, error } = await supabaseAdmin
        .from('whatsapp_sequences')
        .insert({
          company_id: companyId,
          name,
          description,
          json_definition,
          entry_conditions,
          exit_on_reply,
          exit_on_goal,
          is_active,
          send_time_window: send_time_window || {
            start: '09:00',
            end: '17:00',
            timezone: 'Asia/Kolkata'
          },
          max_messages_per_day,
          stats: {
            enrolled: 0,
            active: 0,
            completed: 0,
            messages_sent: 0
          },
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, sequence: data };
    } catch (error) {
      console.error('Error creating sequence:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to create sequence', 500);
    }
  }

  /**
   * Update sequence
   */
  async updateSequence(sequenceId, sequenceData, companyId) {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('whatsapp_sequences')
        .select('id')
        .eq('id', sequenceId)
        .eq('company_id', companyId)
        .single();

      if (fetchError || !existing) {
        throw new ApiError('Sequence not found', 404);
      }

      const updateData = {
        ...sequenceData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('whatsapp_sequences')
        .update(updateData)
        .eq('id', sequenceId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, sequence: data };
    } catch (error) {
      console.error('Error updating sequence:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to update sequence', 500);
    }
  }

  /**
   * Delete sequence
   */
  async deleteSequence(sequenceId, companyId) {
    try {
      const { error } = await supabaseAdmin
        .from('whatsapp_sequences')
        .delete()
        .eq('id', sequenceId)
        .eq('company_id', companyId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting sequence:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to delete sequence', 500);
    }
  }

  /**
   * Enroll lead in sequence
   */
  async enrollLead(sequenceId, leadId, companyId, userId = null) {
    try {
      // Check if already enrolled
      const { data: existing } = await supabaseAdmin
        .from('whatsapp_sequence_enrollments')
        .select('id, status')
        .eq('sequence_id', sequenceId)
        .eq('lead_id', leadId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          throw new ApiError('Lead is already enrolled in this sequence', 400);
        }
        // Reactivate if paused/cancelled
        const { data, error } = await supabaseAdmin
          .from('whatsapp_sequence_enrollments')
          .update({
            status: 'active',
            current_step: 0,
            next_run_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, enrollment: data };
      }

      // Get sequence to determine first step
      const { data: sequence } = await supabaseAdmin
        .from('whatsapp_sequences')
        .select('json_definition, max_messages_per_day')
        .eq('id', sequenceId)
        .single();

      if (!sequence) {
        throw new ApiError('Sequence not found', 404);
      }

      const steps = sequence.json_definition?.steps || [];
      const firstStep = steps[0];
      const nextRunAt = firstStep ? this.calculateNextRunTime(firstStep, sequence.max_messages_per_day) : new Date().toISOString();

      // Create enrollment
      const { data, error } = await supabaseAdmin
        .from('whatsapp_sequence_enrollments')
        .insert({
          sequence_id: sequenceId,
          lead_id: leadId,
          current_step: 0,
          status: 'active',
          next_run_at: nextRunAt,
          enrolled_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Update sequence stats
      await this.updateSequenceStats(sequenceId, 'enrolled', 1);

      return { success: true, enrollment: data };
    } catch (error) {
      console.error('Error enrolling lead:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to enroll lead', 500);
    }
  }

  /**
   * Unenroll lead from sequence
   */
  async unenrollLead(sequenceId, leadId) {
    try {
      const { error } = await supabaseAdmin
        .from('whatsapp_sequence_enrollments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('sequence_id', sequenceId)
        .eq('lead_id', leadId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unenrolling lead:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to unenroll lead', 500);
    }
  }

  /**
   * Process active enrollments and send messages
   * This is called by the scheduler
   */
  async processActiveEnrollments() {
    try {
      const now = new Date().toISOString();

      // Get all active enrollments that are due
      const { data: enrollments, error } = await supabaseAdmin
        .from('whatsapp_sequence_enrollments')
        .select(`
          *,
          sequence:whatsapp_sequences(*),
          lead:leads(*)
        `)
        .eq('status', 'active')
        .lte('next_run_at', now)
        .limit(100); // Process in batches

      if (error) throw error;

      if (!enrollments || enrollments.length === 0) {
        return { success: true, processed: 0 };
      }

      console.log(`[WhatsApp Sequence] Processing ${enrollments.length} active enrollments`);

      let processed = 0;
      let errors = 0;

      for (const enrollment of enrollments) {
        try {
          await this.processEnrollment(enrollment);
          processed++;
        } catch (enrollmentError) {
          console.error(`[WhatsApp Sequence] Error processing enrollment ${enrollment.id}:`, enrollmentError);
          errors++;
        }
      }

      return { success: true, processed, errors, total: enrollments.length };
    } catch (error) {
      console.error('[WhatsApp Sequence] Error processing active enrollments:', error);
      throw error;
    }
  }

  /**
   * Process a single enrollment
   */
  async processEnrollment(enrollment) {
    try {
      const { sequence, lead } = enrollment;

      if (!sequence || !lead) {
        throw new Error('Sequence or lead not found');
      }

      // Check if sequence is active
      if (!sequence.is_active) {
        await this.unenrollLead(sequence.id, lead.id);
        return;
      }

      // Check exit conditions
      if (await this.shouldExitSequence(enrollment, sequence)) {
        await this.completeEnrollment(enrollment.id);
        return;
      }

      // Get current step
      const steps = sequence.json_definition?.steps || [];
      const currentStepIndex = enrollment.current_step || 0;

      if (currentStepIndex >= steps.length) {
        // Sequence completed
        await this.completeEnrollment(enrollment.id);
        return;
      }

      const currentStep = steps[currentStepIndex];

      // Send message for current step
      await this.sendStepMessage(sequence, lead, currentStep);

      // Calculate next step
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = steps[nextStepIndex];

      if (nextStep) {
        // Schedule next step
        const nextRunAt = this.calculateNextRunTime(nextStep, sequence.max_messages_per_day);
        
        await supabaseAdmin
          .from('whatsapp_sequence_enrollments')
          .update({
            current_step: nextStepIndex,
            next_run_at: nextRunAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);

        // Update stats
        await this.updateSequenceStats(sequence.id, 'messages_sent', 1);
      } else {
        // No more steps, complete
        await this.completeEnrollment(enrollment.id);
      }
    } catch (error) {
      console.error(`[WhatsApp Sequence] Error processing enrollment:`, error);
      throw error;
    }
  }

  /**
   * Send message for a sequence step
   */
  async sendStepMessage(sequence, lead, step) {
    try {
      const { type, template_name, language, parameters, message_text } = step;

      // Get WhatsApp ID from lead
      const whatsappId = lead.mobile_phone || lead.phone;
      if (!whatsappId) {
        throw new Error('Lead has no phone number');
      }

      const context = {
        lead_id: lead.id,
        contact_id: lead.contact_id || null,
        account_id: lead.account_id || null,
        user_id: null // System-generated
      };

      if (type === 'template' && template_name) {
        // Send template message
        await whatsappSendService.sendTemplateMessage(
          sequence.company_id,
          whatsappId,
          template_name,
          language || 'en',
          parameters || [],
          context
        );
      } else {
        // Send text message
        const message = message_text || 'Hello from WhatsApp sequence';
        await whatsappSendService.sendTextMessage(
          sequence.company_id,
          whatsappId,
          message,
          context
        );
      }
    } catch (error) {
      console.error('[WhatsApp Sequence] Error sending step message:', error);
      throw error;
    }
  }

  /**
   * Calculate next run time based on step delay and time window
   */
  calculateNextRunTime(step, maxMessagesPerDay) {
    const now = new Date();
    const delay = step.delay || 0; // Delay in hours

    // Add delay
    const nextRun = new Date(now.getTime() + delay * 60 * 60 * 1000);

    // TODO: Apply time window restrictions (send_time_window)
    // For now, just add the delay

    return nextRun.toISOString();
  }

  /**
   * Check if sequence should exit
   */
  async shouldExitSequence(enrollment, sequence) {
    // Check exit_on_reply
    if (sequence.exit_on_reply) {
      // Check if lead has replied recently (within last 24 hours)
      const { data: recentMessages } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('id')
        .eq('lead_id', enrollment.lead_id)
        .eq('direction', 'inbound')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentMessages && recentMessages.length > 0) {
        return true; // Lead replied, exit sequence
      }
    }

    // Check exit_on_goal conditions
    if (sequence.exit_on_goal) {
      // TODO: Implement goal-based exit conditions
      // e.g., lead status changed, deal won, etc.
    }

    return false;
  }

  /**
   * Complete enrollment
   */
  async completeEnrollment(enrollmentId) {
    try {
      await supabaseAdmin
        .from('whatsapp_sequence_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      // Update sequence stats
      const { data: enrollment } = await supabaseAdmin
        .from('whatsapp_sequence_enrollments')
        .select('sequence_id')
        .eq('id', enrollmentId)
        .single();

      if (enrollment) {
        await this.updateSequenceStats(enrollment.sequence_id, 'completed', 1);
        await this.updateSequenceStats(enrollment.sequence_id, 'active', -1);
      }
    } catch (error) {
      console.error('Error completing enrollment:', error);
      throw error;
    }
  }

  /**
   * Update sequence statistics
   */
  async updateSequenceStats(sequenceId, statType, increment) {
    try {
      const { data: sequence } = await supabaseAdmin
        .from('whatsapp_sequences')
        .select('stats')
        .eq('id', sequenceId)
        .single();

      if (!sequence) return;

      const stats = sequence.stats || {};
      stats[statType] = (stats[statType] || 0) + increment;

      await supabaseAdmin
        .from('whatsapp_sequences')
        .update({ stats })
        .eq('id', sequenceId);
    } catch (error) {
      console.error('Error updating sequence stats:', error);
      // Don't throw - stats update failure shouldn't break the flow
    }
  }

  /**
   * Auto-enroll leads based on entry conditions
   */
  async checkAndAutoEnroll(leadId, companyId) {
    try {
      // Get all active sequences with entry conditions
      const { data: sequences } = await supabaseAdmin
        .from('whatsapp_sequences')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .not('entry_conditions', 'is', null);

      if (!sequences || sequences.length === 0) {
        return { success: true, enrolled: 0 };
      }

      // Get lead details
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (!lead) {
        return { success: true, enrolled: 0 };
      }

      let enrolled = 0;

      for (const sequence of sequences) {
        if (this.matchesEntryConditions(lead, sequence.entry_conditions)) {
          try {
            await this.enrollLead(sequence.id, leadId, companyId, null);
            enrolled++;
          } catch (error) {
            console.error(`Error auto-enrolling lead in sequence ${sequence.id}:`, error);
          }
        }
      }

      return { success: true, enrolled };
    } catch (error) {
      console.error('Error checking auto-enroll:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if lead matches entry conditions
   */
  matchesEntryConditions(lead, conditions) {
    if (!conditions || typeof conditions !== 'object') {
      return false;
    }

    // Simple condition matching
    // TODO: Implement more complex condition logic
    if (conditions.source && lead.source !== conditions.source) {
      return false;
    }

    if (conditions.status && lead.status !== conditions.status) {
      return false;
    }

    return true;
  }
}

module.exports = new WhatsAppSequenceService();

