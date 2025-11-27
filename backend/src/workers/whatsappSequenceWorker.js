const cron = require('node-cron');
const whatsappSequenceService = require('../services/whatsappSequenceService');

/**
 * WhatsApp Sequence Worker
 * Processes due WhatsApp sequence enrollments on a schedule
 */
class WhatsAppSequenceWorker {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the worker
   */
  start() {
    console.log('📱 [WHATSAPP WORKER] Starting WhatsApp sequence worker...');

    // Run every 5 minutes (WhatsApp has stricter rate limits than email)
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.processEnrollments();
    });

    console.log('📱 [WHATSAPP WORKER] WhatsApp sequence worker started (runs every 5 minutes)');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('📱 [WHATSAPP WORKER] WhatsApp sequence worker stopped');
    }
  }

  /**
   * Process due enrollments
   */
  async processEnrollments() {
    // Prevent overlapping runs
    if (this.isRunning) {
      console.log('📱 [WHATSAPP WORKER] Previous run still in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const startTime = Date.now();
      console.log('📱 [WHATSAPP WORKER] Processing due enrollments...');

      const result = await whatsappSequenceService.processActiveEnrollments();

      const duration = Date.now() - startTime;
      const { processed = 0, errors = 0, total = 0 } = result;

      console.log(`📱 [WHATSAPP WORKER] Completed in ${duration}ms - Processed: ${processed}, Errors: ${errors}, Total: ${total}`);

      if (errors > 0) {
        console.error(`📱 [WHATSAPP WORKER] ${errors} enrollment(s) failed processing`);
      }
    } catch (error) {
      console.error('📱 [WHATSAPP WORKER] Error processing enrollments:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run immediately (for testing)
   */
  async runNow() {
    console.log('📱 [WHATSAPP WORKER] Running immediately...');
    await this.processEnrollments();
  }
}

// Create singleton instance
const worker = new WhatsAppSequenceWorker();

// Auto-start in production, manual start in development
if (process.env.NODE_ENV === 'production' || process.env.START_WHATSAPP_WORKER === 'true') {
  worker.start();
} else {
  console.log('📱 [WHATSAPP WORKER] WhatsApp sequence worker not started (set START_WHATSAPP_WORKER=true to enable in development)');
}

module.exports = worker;

