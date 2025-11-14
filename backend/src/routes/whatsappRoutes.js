const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const whatsappWebhookController = require('../controllers/whatsappWebhookController');
const whatsappSequenceController = require('../controllers/whatsappSequenceController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Webhook routes (no authentication - Meta verifies via signature)
router.get('/webhooks/meta', whatsappWebhookController.verifyWebhook.bind(whatsappWebhookController));
router.post('/webhooks/meta', whatsappWebhookController.handleWebhook.bind(whatsappWebhookController));

// Protected routes (require authentication)
router.use(authenticate);

// Send messages (Sales Rep+)
router.post('/send/text', requireRole(['sales_rep', 'manager', 'company_admin', 'super_admin']), whatsappController.sendTextMessage.bind(whatsappController));
router.post('/send/template', requireRole(['sales_rep', 'manager', 'company_admin', 'super_admin']), whatsappController.sendTemplateMessage.bind(whatsappController));

// Get messages (parameterized route must come first)
router.get('/messages/:leadId', whatsappController.getLeadMessages.bind(whatsappController));
router.get('/messages', whatsappController.getMessages.bind(whatsappController));

// Get conversations
router.get('/conversations', whatsappController.getConversations.bind(whatsappController));

// Templates
router.get('/templates', whatsappController.getTemplates.bind(whatsappController));

// Settings (Manager+)
router.get('/settings', requireRole(['manager', 'company_admin', 'super_admin']), whatsappController.getSettings.bind(whatsappController));
router.post('/settings', requireRole(['manager', 'company_admin', 'super_admin']), whatsappController.updateSettings.bind(whatsappController));

// Sequences/Campaigns (Manager+)
router.get('/sequences', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.getSequences.bind(whatsappSequenceController));
router.get('/sequences/:id', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.getSequenceById.bind(whatsappSequenceController));
router.post('/sequences', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.createSequence.bind(whatsappSequenceController));
router.put('/sequences/:id', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.updateSequence.bind(whatsappSequenceController));
router.delete('/sequences/:id', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.deleteSequence.bind(whatsappSequenceController));
router.post('/sequences/:id/enroll', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.enrollLead.bind(whatsappSequenceController));
router.post('/sequences/:id/unenroll', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.unenrollLead.bind(whatsappSequenceController));
router.get('/sequences/:id/enrollments', requireRole(['manager', 'company_admin', 'super_admin']), whatsappSequenceController.getEnrollments.bind(whatsappSequenceController));

module.exports = router;

