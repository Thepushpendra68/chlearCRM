/**
 * WhatsApp Webhook Controller Tests
 * Tests for webhook verification and event handling
 */

const request = require('supertest');
const app = require('../../app');
const whatsappWebhookService = require('../../services/whatsappWebhookService');
const whatsappMetaService = require('../../services/whatsappMetaService');

jest.mock('../../services/whatsappWebhookService');
jest.mock('../../services/whatsappMetaService');

describe('WhatsApp Webhook Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.META_WHATSAPP_VERIFY_TOKEN = 'test_verify_token';
  });

  describe('GET /api/whatsapp/webhooks/meta', () => {
    it('should verify webhook with correct token', async () => {
      const response = await request(app)
        .get('/api/whatsapp/webhooks/meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test_verify_token',
          'hub.challenge': 'challenge_string_123'
        })
        .expect(200);

      expect(response.text).toBe('challenge_string_123');
    });

    it('should reject webhook with incorrect token', async () => {
      await request(app)
        .get('/api/whatsapp/webhooks/meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': 'challenge_string_123'
        })
        .expect(403);
    });

    it('should reject webhook with missing parameters', async () => {
      await request(app)
        .get('/api/whatsapp/webhooks/meta')
        .query({
          'hub.mode': 'subscribe'
        })
        .expect(403);
    });
  });

  describe('POST /api/whatsapp/webhooks/meta', () => {
    it('should process incoming message webhook', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'business_account_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                phone_number_id: '123456789'
              },
              messages: [{
                from: '919876543210',
                id: 'wamid.test123',
                timestamp: '1234567890',
                type: 'text',
                text: {
                  body: 'Hello from customer'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      whatsappMetaService.verifyWebhookSignature.mockReturnValue(true);
      whatsappWebhookService.processWebhookEvent.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .post('/api/whatsapp/webhooks/meta')
        .set('x-hub-signature-256', 'sha256=valid_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.status).toBe('received');
      expect(whatsappWebhookService.processWebhookEvent).toHaveBeenCalledWith(
        webhookPayload
      );
    });

    it('should reject webhook with invalid signature', async () => {
      whatsappMetaService.verifyWebhookSignature.mockReturnValue(false);

      await request(app)
        .post('/api/whatsapp/webhooks/meta')
        .set('x-hub-signature-256', 'sha256=invalid_signature')
        .send({ object: 'whatsapp_business_account' })
        .expect(403);

      expect(whatsappWebhookService.processWebhookEvent).not.toHaveBeenCalled();
    });

    it('should process message status update', async () => {
      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              statuses: [{
                id: 'wamid.test123',
                status: 'delivered',
                timestamp: '1234567890',
                recipient_id: '919876543210'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      whatsappMetaService.verifyWebhookSignature.mockReturnValue(true);
      whatsappWebhookService.processWebhookEvent.mockResolvedValue({
        success: true
      });

      await request(app)
        .post('/api/whatsapp/webhooks/meta')
        .set('x-hub-signature-256', 'sha256=valid')
        .send(statusPayload)
        .expect(200);

      expect(whatsappWebhookService.processWebhookEvent).toHaveBeenCalled();
    });

    it('should handle webhook processing errors gracefully', async () => {
      whatsappMetaService.verifyWebhookSignature.mockReturnValue(true);
      whatsappWebhookService.processWebhookEvent.mockRejectedValue(
        new Error('Processing error')
      );

      // Should still return 200 to prevent Meta from retrying
      await request(app)
        .post('/api/whatsapp/webhooks/meta')
        .set('x-hub-signature-256', 'sha256=valid')
        .send({ object: 'whatsapp_business_account', entry: [] })
        .expect(200);
    });

    it('should handle multiple messages in one webhook', async () => {
      const multiMessagePayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [
                { from: '919876543210', id: 'msg1', type: 'text', text: { body: 'Hello' } },
                { from: '919876543210', id: 'msg2', type: 'text', text: { body: 'World' } }
              ]
            },
            field: 'messages'
          }]
        }]
      };

      whatsappMetaService.verifyWebhookSignature.mockReturnValue(true);
      whatsappWebhookService.processWebhookEvent.mockResolvedValue({
        success: true
      });

      await request(app)
        .post('/api/whatsapp/webhooks/meta')
        .set('x-hub-signature-256', 'sha256=valid')
        .send(multiMessagePayload)
        .expect(200);

      expect(whatsappWebhookService.processWebhookEvent).toHaveBeenCalled();
    });
  });
});

