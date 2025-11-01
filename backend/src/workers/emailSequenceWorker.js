const cron = require('node-cron');
const automationService = require('../services/automationService');

/**
 * Email Sequence Worker
 * Processes due sequence enrollments on a schedule
 */
class EmailSequenceWorker {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the worker
   */
  start() {
    console.log('📧 [EMAIL WORKER] Starting email sequence worker...');

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processEnrollments();
    });

    console.log('📧 [EMAIL WORKER] Email sequence worker started (runs every minute)');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('📧 [EMAIL WORKER] Email sequence worker stopped');
    }
  }

  /**
   * Process due enrollments
   */
  async processEnrollments() {
    // Prevent overlapping runs
    if (this.isRunning) {
      console.log('📧 [EMAIL WORKER] Previous run still in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const startTime = Date.now();
      console.log('📧 [EMAIL WORKER] Processing due enrollments...');

      const results = await automationService.processDueEnrollments();

      const duration = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`📧 [EMAIL WORKER] Completed in ${duration}ms - Success: ${successful}, Failed: ${failed}`);

      if (failed > 0) {
        console.error(`📧 [EMAIL WORKER] ${failed} enrollment(s) failed processing`);
      }
    } catch (error) {
      console.error('📧 [EMAIL WORKER] Error processing enrollments:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run immediately (for testing)
   */
  async runNow() {
    console.log('📧 [EMAIL WORKER] Running immediately...');
    await this.processEnrollments();
  }
}

// Create singleton instance
const worker = new EmailSequenceWorker();

// Auto-start in production, manual start in development
if (process.env.NODE_ENV === 'production' || process.env.START_EMAIL_WORKER === 'true') {
  worker.start();
} else {
  console.log('📧 [EMAIL WORKER] Email sequence worker not started (set START_EMAIL_WORKER=true to enable in development)');
}

module.exports = worker;

