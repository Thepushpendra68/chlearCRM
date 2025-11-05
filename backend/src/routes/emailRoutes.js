const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const emailTemplateController = require('../controllers/emailTemplateController');
const emailSendController = require('../controllers/emailSendController');
const automationController = require('../controllers/automationController');
const emailWebhookController = require('../controllers/emailWebhookController');
const workflowTemplateController = require('../controllers/workflowTemplateController');

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

// Integration settings
router.get('/settings/integration', emailTemplateController.getIntegrationSettings);
router.post('/settings/integration', authorize(['company_admin', 'manager']), emailTemplateController.upsertIntegrationSettings);

// =====================================================
// AI-POWERED EMAIL FEATURES
// =====================================================

// AI Status
router.get('/ai/status', emailTemplateController.aiStatus);

// Template AI
router.post('/ai/generate-template', authorize(['company_admin', 'manager']), emailTemplateController.aiGenerateTemplate);
router.post('/ai/generate-subject-variants', emailTemplateController.aiGenerateSubjectVariants);
router.post('/ai/optimize-content', authorize(['company_admin', 'manager']), emailTemplateController.aiOptimizeContent);
router.post('/ai/suggest-variables', emailTemplateController.aiSuggestVariables);

// Sequence AI
router.post('/ai/generate-sequence', authorize(['company_admin', 'manager']), emailTemplateController.aiGenerateSequence);
router.post('/ai/optimize-timing', emailTemplateController.aiOptimizeTiming);

// Personalization AI
router.post('/ai/personalized-subject', emailTemplateController.aiPersonalizedSubject);
router.post('/ai/personalized-email', emailTemplateController.aiPersonalizedEmail);
router.post('/ai/optimal-send-time', emailTemplateController.aiOptimalSendTime);

// Analytics AI
router.post('/ai/analyze-performance', emailTemplateController.aiAnalyzePerformance);
router.post('/ai/predict-engagement', emailTemplateController.aiPredictEngagement);

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

// =====================================================
// WORKFLOW TEMPLATE LIBRARY ROUTES
// =====================================================

// Template Packs (MUST be before /:id routes to avoid matching "packs" as an ID)
router.get('/workflow-templates/packs', workflowTemplateController.getTemplatePacks);
router.get('/workflow-templates/packs/:id', workflowTemplateController.getPackById);

// Import/Export (specific routes before /:id)
router.post('/workflow-templates/import', authorize(['company_admin', 'manager']), workflowTemplateController.importTemplate);
router.get('/workflow-templates/:id/export', workflowTemplateController.exportTemplate);

// Templates
router.get('/workflow-templates', workflowTemplateController.getTemplates);
router.get('/workflow-templates/:id', workflowTemplateController.getTemplateById);
router.post('/workflow-templates', authorize(['company_admin', 'manager']), workflowTemplateController.createTemplate);
router.put('/workflow-templates/:id', authorize(['company_admin', 'manager']), workflowTemplateController.updateTemplate);
router.delete('/workflow-templates/:id', authorize(['company_admin']), workflowTemplateController.deleteTemplate);

// Create sequence from template
router.post('/workflow-templates/:id/create-sequence', authorize(['company_admin', 'manager']), workflowTemplateController.createSequenceFromTemplate);

module.exports = router;

