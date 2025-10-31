const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const emailTemplateController = require('../controllers/emailTemplateController');
const emailSendController = require('../controllers/emailSendController');
const automationController = require('../controllers/automationController');
const emailWebhookController = require('../controllers/emailWebhookController');

const router = express.Router();

// =====================================================
// WEBHOOK ROUTES (NO AUTH - called by providers)
// =====================================================
router.post('/webhooks/postmark', emailWebhookController.handlePostmarkWebhook);
router.post('/webhooks/sendgrid', emailWebhookController.handleSendGridWebhook);
router.get('/webhooks/test', emailWebhookController.testWebhook);

// =====================================================
// AUTHENTICATED ROUTES
// =====================================================
router.use(authenticate);

// =====================================================
// EMAIL TEMPLATE ROUTES
// =====================================================

// Get folders
router.get('/templates/folders', emailTemplateController.getFolders);

// Compile MJML
router.post('/templates/compile-mjml', emailTemplateController.compileMJML);

// Template CRUD
router.get('/templates', emailTemplateController.getTemplates);
router.get('/templates/:id', emailTemplateController.getTemplateById);
router.post('/templates', authorize(['company_admin', 'manager']), emailTemplateController.createTemplate);
router.put('/templates/:id', authorize(['company_admin', 'manager']), emailTemplateController.updateTemplate);
router.delete('/templates/:id', authorize(['company_admin']), emailTemplateController.deleteTemplate);

// Template versions
router.post('/templates/:id/versions', authorize(['company_admin', 'manager']), emailTemplateController.createVersion);
router.post('/templates/versions/:versionId/publish', authorize(['company_admin', 'manager']), emailTemplateController.publishVersion);
router.post('/templates/versions/:versionId/preview', emailTemplateController.previewTemplate);

// =====================================================
// EMAIL SENDING ROUTES
// =====================================================

router.post('/send/lead', emailSendController.sendToLead);
router.post('/send/custom', emailSendController.sendToEmail);
router.get('/sent', emailSendController.getSentEmails);
router.get('/sent/:id', emailSendController.getEmailDetails);

// =====================================================
// SUPPRESSION LIST ROUTES
// =====================================================

router.get('/suppression', emailSendController.getSuppressionList);
router.post('/suppression', authorize(['company_admin', 'manager']), emailSendController.addToSuppressionList);
router.delete('/suppression/:email', authorize(['company_admin']), emailSendController.removeFromSuppressionList);

// =====================================================
// AUTOMATION/SEQUENCE ROUTES
// =====================================================

// Sequences
router.get('/sequences', automationController.getSequences);
router.get('/sequences/:id', automationController.getSequenceById);
router.post('/sequences', authorize(['company_admin', 'manager']), automationController.createSequence);
router.put('/sequences/:id', authorize(['company_admin', 'manager']), automationController.updateSequence);
router.delete('/sequences/:id', authorize(['company_admin']), automationController.deleteSequence);

// Enrollments
router.post('/sequences/:id/enroll', automationController.enrollLead);
router.post('/enrollments/:enrollmentId/unenroll', automationController.unenrollLead);
router.get('/sequences/:id/enrollments', automationController.getEnrollments);

// Process (internal/cron)
router.post('/process', automationController.processDueEnrollments);

module.exports = router;

