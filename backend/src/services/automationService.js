const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const emailSendService = require('./emailSendService');
const { addDays, addHours, addMinutes, isBefore, isAfter } = require('date-fns');

/**
 * Automation Service
 * Manages email sequences and automation rules
 */
class AutomationService {
  /**
   * Get all sequences for company
   */
  async getSequences(currentUser, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('email_sequences')
        .select('*, created_by_user:user_profiles!created_by(id, first_name, last_name)')
        .eq('company_id', currentUser.company_id);

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching sequences:', error);
      throw new ApiError('Failed to fetch sequences', 500);
    }
  }

  /**
   * Get sequence by ID
   */
  async getSequenceById(sequenceId, currentUser) {
    try {
      const { data: sequence, error } = await supabaseAdmin
        .from('email_sequences')
        .select('*, created_by_user:user_profiles!created_by(id, first_name, last_name)')
        .eq('id', sequenceId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (error || !sequence) {
        throw new ApiError('Sequence not found', 404);
      }

      // Get enrollments count
      const { count } = await supabaseAdmin
        .from('sequence_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('sequence_id', sequenceId);

      sequence.enrollments_count = count || 0;

      return sequence;
    } catch (error) {
      console.error('Error fetching sequence:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch sequence', 500);
    }
  }

  /**
   * Create sequence
   */
  async createSequence(sequenceData, currentUser) {
    try {
      const { data: sequence, error } = await supabaseAdmin
        .from('email_sequences')
        .insert({
          company_id: currentUser.company_id,
          name: sequenceData.name,
          description: sequenceData.description || null,
          json_definition: sequenceData.json_definition || { steps: [] },
          entry_conditions: sequenceData.entry_conditions || null,
          exit_on_reply: sequenceData.exit_on_reply !== undefined ? sequenceData.exit_on_reply : true,
          exit_on_goal: sequenceData.exit_on_goal || null,
          is_active: false, // Start inactive for safety
          send_time_window: sequenceData.send_time_window || null,
          max_emails_per_day: sequenceData.max_emails_per_day || 3,
          stats: { enrolled: 0, active: 0, completed: 0, emails_sent: 0 },
          created_by: currentUser.id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new ApiError('Sequence name already exists', 400);
        }
        throw error;
      }

      return sequence;
    } catch (error) {
      console.error('Error creating sequence:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create sequence', 500);
    }
  }

  /**
   * Update sequence
   */
  async updateSequence(sequenceId, sequenceData, currentUser) {
    try {
      const updateData = {};
      if (sequenceData.name !== undefined) updateData.name = sequenceData.name;
      if (sequenceData.description !== undefined) updateData.description = sequenceData.description;
      if (sequenceData.json_definition !== undefined) updateData.json_definition = sequenceData.json_definition;
      if (sequenceData.entry_conditions !== undefined) updateData.entry_conditions = sequenceData.entry_conditions;
      if (sequenceData.exit_on_reply !== undefined) updateData.exit_on_reply = sequenceData.exit_on_reply;
      if (sequenceData.exit_on_goal !== undefined) updateData.exit_on_goal = sequenceData.exit_on_goal;
      if (sequenceData.is_active !== undefined) updateData.is_active = sequenceData.is_active;
      if (sequenceData.send_time_window !== undefined) updateData.send_time_window = sequenceData.send_time_window;
      if (sequenceData.max_emails_per_day !== undefined) updateData.max_emails_per_day = sequenceData.max_emails_per_day;

      updateData.updated_at = new Date().toISOString();

      const { data: sequence, error } = await supabaseAdmin
        .from('email_sequences')
        .update(updateData)
        .eq('id', sequenceId)
        .eq('company_id', currentUser.company_id)
        .select()
        .single();

      if (error || !sequence) {
        throw new ApiError('Sequence not found or update failed', 404);
      }

      return sequence;
    } catch (error) {
      console.error('Error updating sequence:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update sequence', 500);
    }
  }

  /**
   * Delete sequence
   */
  async deleteSequence(sequenceId, currentUser) {
    try {
      // Check for active enrollments
      const { count } = await supabaseAdmin
        .from('sequence_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('sequence_id', sequenceId)
        .eq('status', 'active');

      if (count > 0) {
        throw new ApiError(`Cannot delete sequence with ${count} active enrollment(s)`, 400);
      }

      const { error } = await supabaseAdmin
        .from('email_sequences')
        .delete()
        .eq('id', sequenceId)
        .eq('company_id', currentUser.company_id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting sequence:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete sequence', 500);
    }
  }

  /**
   * Enroll lead in sequence
   */
  async enrollLead(sequenceId, leadId, currentUser) {
    try {
      // Verify sequence exists and is active
      const { data: sequence, error: seqError } = await supabaseAdmin
        .from('email_sequences')
        .select('*')
        .eq('id', sequenceId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (seqError || !sequence) {
        throw new ApiError('Sequence not found', 404);
      }

      if (!sequence.is_active) {
        throw new ApiError('Cannot enroll in inactive sequence', 400);
      }

      // Verify lead exists
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('id, email')
        .eq('id', leadId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (leadError || !lead) {
        throw new ApiError('Lead not found', 404);
      }

      if (!lead.email) {
        throw new ApiError('Lead does not have an email address', 400);
      }

      // Check if already enrolled
      const { data: existing } = await supabaseAdmin
        .from('sequence_enrollments')
        .select('id, status')
        .eq('sequence_id', sequenceId)
        .eq('lead_id', leadId)
        .single();

      if (existing) {
        if (existing.status === 'active') {
          throw new ApiError('Lead is already enrolled in this sequence', 400);
        }
        // Re-enroll if previously completed/exited
      }

      // Calculate next run time for first step
      const nextRunAt = this.calculateNextRunTime(
        sequence.json_definition.steps[0],
        sequence.send_time_window
      );

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabaseAdmin
        .from('sequence_enrollments')
        .insert({
          sequence_id: sequenceId,
          lead_id: leadId,
          status: 'active',
          current_step: 0,
          next_run_at: nextRunAt,
          steps_completed: 0,
          emails_sent: 0,
          metadata: {},
          enrolled_by: currentUser.id,
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (enrollError) {
        if (enrollError.code === '23505') {
          throw new ApiError('Lead is already enrolled', 400);
        }
        throw enrollError;
      }

      // Update sequence stats
      await this.updateSequenceStats(sequenceId);

      return enrollment;
    } catch (error) {
      console.error('Error enrolling lead:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to enroll lead', 500);
    }
  }

  /**
   * Unenroll lead from sequence
   */
  async unenrollLead(enrollmentId, reason = 'manual', currentUser) {
    try {
      const { data: enrollment, error } = await supabaseAdmin
        .from('sequence_enrollments')
        .update({
          status: 'exited',
          exit_reason: reason,
          exited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .select('sequence_id')
        .single();

      if (error || !enrollment) {
        throw new ApiError('Enrollment not found', 404);
      }

      // Update sequence stats
      await this.updateSequenceStats(enrollment.sequence_id);

      return { success: true };
    } catch (error) {
      console.error('Error unenrolling lead:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to unenroll lead', 500);
    }
  }

  /**
   * Process due enrollments (called by cron)
   */
  async processDueEnrollments() {
    try {
      const now = new Date().toISOString();

      // Get all due enrollments
      const { data: enrollments, error } = await supabaseAdmin
        .from('sequence_enrollments')
        .select(`
          *,
          sequence:email_sequences(*),
          lead:leads(*)
        `)
        .eq('status', 'active')
        .lte('next_run_at', now)
        .limit(100); // Process in batches

      if (error) throw error;

      console.log(`Processing ${enrollments?.length || 0} due enrollments`);

      const results = [];
      for (const enrollment of enrollments || []) {
        try {
          const result = await this.processEnrollment(enrollment);
          results.push(result);
        } catch (error) {
          console.error(`Error processing enrollment ${enrollment.id}:`, error);
          results.push({ enrollment_id: enrollment.id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing due enrollments:', error);
      throw error;
    }
  }

  /**
   * Process single enrollment
   */
  async processEnrollment(enrollment) {
    try {
      const { sequence, lead, current_step } = enrollment;
      const steps = sequence.json_definition.steps;

      if (current_step >= steps.length) {
        // Sequence complete
        await supabaseAdmin
          .from('sequence_enrollments')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);

        await this.updateSequenceStats(sequence.id);
        return { enrollment_id: enrollment.id, success: true, action: 'completed' };
      }

      const step = steps[current_step];

      // Execute step action
      if (step.type === 'send_email' && step.template_version_id) {
        // Check daily email limit
        if (sequence.max_emails_per_day) {
          const todayCount = await this.getTodayEmailCount(enrollment.id);
          if (todayCount >= sequence.max_emails_per_day) {
            // Delay until tomorrow
            const nextRunAt = addDays(new Date(), 1);
            await supabaseAdmin
              .from('sequence_enrollments')
              .update({ next_run_at: nextRunAt.toISOString() })
              .eq('id', enrollment.id);
            return { enrollment_id: enrollment.id, success: true, action: 'rate_limited' };
          }
        }

        // Send email (using a system user context)
        const systemUser = { id: enrollment.enrolled_by, company_id: sequence.company_id };
        await emailSendService.sendToLead(
          lead.id,
          step.template_version_id,
          step.custom_data || {},
          systemUser
        );

        // Update stats
        const stats = sequence.stats || {};
        stats.emails_sent = (stats.emails_sent || 0) + 1;
        await supabaseAdmin
          .from('email_sequences')
          .update({ stats })
          .eq('id', sequence.id);
      }

      // Move to next step
      const nextStep = current_step + 1;
      const nextRunAt = nextStep < steps.length
        ? this.calculateNextRunTime(steps[nextStep], sequence.send_time_window)
        : null;

      await supabaseAdmin
        .from('sequence_enrollments')
        .update({
          current_step: nextStep,
          steps_completed: current_step + 1,
          emails_sent: enrollment.emails_sent + 1,
          last_email_sent_at: new Date().toISOString(),
          next_run_at: nextRunAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);

      return { enrollment_id: enrollment.id, success: true, action: 'step_executed' };
    } catch (error) {
      console.error('Error processing enrollment:', error);
      // Mark as failed
      await supabaseAdmin
        .from('sequence_enrollments')
        .update({
          status: 'failed',
          exit_reason: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);
      throw error;
    }
  }

  /**
   * Calculate next run time based on delay and time window
   */
  calculateNextRunTime(step, timeWindow) {
    let nextRun = new Date();

    // Apply step delay
    if (step.delay) {
      switch (step.delay.unit) {
        case 'minutes':
          nextRun = addMinutes(nextRun, step.delay.value);
          break;
        case 'hours':
          nextRun = addHours(nextRun, step.delay.value);
          break;
        case 'days':
          nextRun = addDays(nextRun, step.delay.value);
          break;
      }
    }

    // Apply time window if specified
    if (timeWindow && timeWindow.start && timeWindow.end) {
      const hour = nextRun.getHours();
      const [startHour] = timeWindow.start.split(':').map(Number);
      const [endHour] = timeWindow.end.split(':').map(Number);

      if (hour < startHour) {
        nextRun.setHours(startHour, 0, 0, 0);
      } else if (hour >= endHour) {
        // Move to next day
        nextRun = addDays(nextRun, 1);
        nextRun.setHours(startHour, 0, 0, 0);
      }
    }

    return nextRun.toISOString();
  }

  /**
   * Get today's email count for enrollment
   */
  async getTodayEmailCount(enrollmentId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabaseAdmin
        .from('sequence_enrollments')
      .select('emails_sent, last_email_sent_at')
      .eq('id', enrollmentId)
      .single();

    if (!data || !data.last_email_sent_at) return 0;

    const lastSent = new Date(data.last_email_sent_at);
    if (lastSent >= todayStart) {
      return data.emails_sent;
    }

    return 0;
  }

  /**
   * Update sequence stats
   */
  async updateSequenceStats(sequenceId) {
    try {
      const { data: enrollments } = await supabaseAdmin
        .from('sequence_enrollments')
        .select('status')
        .eq('sequence_id', sequenceId);

      const stats = {
        enrolled: enrollments?.length || 0,
        active: enrollments?.filter(e => e.status === 'active').length || 0,
        completed: enrollments?.filter(e => e.status === 'completed').length || 0
      };

      await supabaseAdmin
        .from('email_sequences')
        .update({ stats })
        .eq('id', sequenceId);
    } catch (error) {
      console.error('Error updating sequence stats:', error);
    }
  }

  /**
   * Get enrollments for a sequence
   */
  async getEnrollments(sequenceId, currentUser, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('sequence_enrollments')
        .select('*, lead:leads(id, name, email, status)')
        .eq('sequence_id', sequenceId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('enrolled_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw new ApiError('Failed to fetch enrollments', 500);
    }
  }
}

module.exports = new AutomationService();

