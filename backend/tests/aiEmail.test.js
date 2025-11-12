const request = require('supertest');
const app = require('../src/app');

describe('AI Email API', () => {
  let authToken;
  let managerToken;
  let salesRepToken;

  beforeAll(async () => {
    authToken = 'mock-jwt-token';
    managerToken = 'manager-token';
    salesRepToken = 'salesrep-token';

    // Mock auth middleware with role-based access
    jest.mock('../src/middleware/authMiddleware', () => ({
      authenticate: (req, res, next) => {
        if (req.headers.authorization === `Bearer ${managerToken}`) {
          req.user = { id: 'manager-1', role: 'manager', company_id: 'company-1' };
        } else if (req.headers.authorization === `Bearer ${salesRepToken}`) {
          req.user = { id: 'salesrep-1', role: 'sales_rep', company_id: 'company-1' };
        } else {
          req.user = { id: 'admin-1', role: 'company_admin', company_id: 'company-1' };
        }
        next();
      },
      authorize: (roles) => (req, res, next) => {
        if (roles.includes(req.user.role)) {
          next();
        } else {
          res.status(403).json({ success: false, message: 'Forbidden' });
        }
      }
    }));
  });

  describe('GET /api/email/ai/status', () => {
    test('should return AI service status', async () => {
      const response = await request(app)
        .get('/api/email/ai/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
    });

    test('should return configuration info', async () => {
      const response = await request(app)
        .get('/api/email/ai/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data).toHaveProperty('model');
      expect(response.body.data).toHaveProperty('configured');
    });
  });

  describe('POST /api/email/ai/generate-template', () => {
    test('should generate email template', async () => {
      const requestData = {
        prompt: 'Create a welcome email for new SaaS customers',
        tone: 'professional',
        industry: 'saas',
        email_type: 'welcome'
      };

      const response = await request(app)
        .post('/api/email/ai/generate-template')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('mjml');
      expect(response.body.data).toHaveProperty('subject');
      expect(response.body.data.mjml).toContain('<mjml>');
    });

    test('should require manager or admin role', async () => {
      const requestData = {
        prompt: 'Create an email',
        tone: 'friendly'
      };

      const response = await request(app)
        .post('/api/email/ai/generate-template')
        .set('Authorization', `Bearer ${salesRepToken}`)
        .send(requestData);

      expect(response.status).toBe(403);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        // Missing prompt
        tone: 'friendly'
      };

      const response = await request(app)
        .post('/api/email/ai/generate-template')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should respect industry parameter', async () => {
      const requestData = {
        prompt: 'Create a promotional email',
        industry: 'ecommerce',
        tone: 'enthusiastic'
      };

      const response = await request(app)
        .post('/api/email/ai/generate-template')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      // Should generate industry-specific content
    });
  });

  describe('POST /api/email/ai/generate-subject-variants', () => {
    test('should generate subject line variants', async () => {
      const requestData = {
        base_subject: 'Welcome to our platform!',
        count: 3,
        tone: 'friendly'
      };

      const response = await request(app)
        .post('/api/email/ai/generate-subject-variants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('variants');
      expect(Array.isArray(response.body.data.variants)).toBe(true);
      expect(response.body.data.variants.length).toBe(3);
    });

    test('should validate count parameter (1-10)', async () => {
      const requestData = {
        base_subject: 'Test',
        count: 15 // Too many
      };

      const response = await request(app)
        .post('/api/email/ai/generate-subject-variants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(400);
    });

    test('should generate unique variants', async () => {
      const requestData = {
        base_subject: 'Weekly Update',
        count: 5,
        tone: 'professional'
      };

      const response = await request(app)
        .post('/api/email/ai/generate-subject-variants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      const variants = response.body.data.variants;
      const uniqueVariants = new Set(variants);
      expect(uniqueVariants.size).toBe(variants.length); // All unique
    });
  });

  describe('POST /api/email/ai/optimize-content', () => {
    test('should optimize email content', async () => {
      const requestData = {
        content: 'Hello {{lead.name}}, thanks for signing up!',
        goal: 'increase engagement',
        audience: 'new customers'
      };

      const response = await request(app)
        .post('/api/email/ai/optimize-content')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimized_content');
    });

    test('should accept different optimization goals', async () => {
      const goals = ['increase engagement', 'improve clarity', 'boost conversions', 'add personalization'];

      for (const goal of goals) {
        const requestData = {
          content: 'Test content',
          goal: goal,
          audience: 'test'
        };

        const response = await request(app)
          .post('/api/email/ai/optimize-content')
          .set('Authorization', `Bearer ${managerToken}`)
          .send(requestData);

        expect(response.status).toBe(200);
      }
    });

    test('should preserve merge variables', async () => {
      const requestData = {
        content: 'Hello {{lead.name}}, welcome to {{company.name}}!',
        goal: 'increase engagement',
        audience: 'new customers'
      };

      const response = await request(app)
        .post('/api/email/ai/optimize-content')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      // Merge variables should be preserved
      expect(response.body.data.optimized_content).toContain('{{lead.name}}');
    });
  });

  describe('POST /api/email/ai/suggest-variables', () => {
    test('should suggest merge variables', async () => {
      const requestData = {
        content: 'Welcome to our platform!',
        context: 'welcome email'
      };

      const response = await request(app)
        .post('/api/email/ai/suggest-variables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });

    test('should return relevant variable types', async () => {
      const requestData = {
        content: 'Thank you for your purchase',
        context: 'transactional'
      };

      const response = await request(app)
        .post('/api/email/ai/suggest-variables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      const suggestions = response.body.data.suggestions;
      // Should include relevant variables like lead_name, product_name, etc.
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/email/ai/generate-sequence', () => {
    test('should generate email sequence', async () => {
      const requestData = {
        prompt: 'Create a 3-email nurture sequence for trial users',
        industry: 'saas',
        days: 14
      };

      const response = await request(app)
        .post('/api/email/ai/generate-sequence')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sequence');
      expect(response.body.data.sequence).toHaveProperty('steps');
      expect(Array.isArray(response.body.data.sequence.steps)).toBe(true);
    });

    test('should validate sequence parameters', async () => {
      const requestData = {
        prompt: 'Create sequence',
        days: -5 // Invalid
      };

      const response = await request(app)
        .post('/api/email/ai/generate-sequence')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      expect(response.status).toBe(400);
    });

    test('should generate appropriate delays between emails', async () => {
      const requestData = {
        prompt: 'Create 5-email sequence',
        industry: 'ecommerce',
        days: 30
      };

      const response = await request(app)
        .post('/api/email/ai/generate-sequence')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      const steps = response.body.data.sequence.steps;
      // Verify delays are appropriate (progressively increasing)
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].delay_hours).toBeGreaterThan(steps[i - 1].delay_hours);
      }
    });
  });

  describe('POST /api/email/ai/optimize-timing', () => {
    test('should suggest optimal send time', async () => {
      const requestData = {
        audience: 'B2B professionals',
        timezone: 'America/New_York'
      };

      const response = await request(app)
        .post('/api/email/ai/optimize-timing')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommended_time');
      expect(response.body.data).toHaveProperty('reasoning');
    });

    test('should consider audience type', async () => {
      const audiences = ['B2B professionals', 'consumers', 'students', 'remote workers'];

      for (const audience of audiences) {
        const requestData = { audience };

        const response = await request(app)
          .post('/api/email/ai/optimize-timing')
          .set('Authorization', `Bearer ${authToken}`)
          .send(requestData);

        expect(response.status).toBe(200);
      }
    });
  });

  describe('POST /api/email/ai/personalized-subject', () => {
    test('should generate personalized subject lines', async () => {
      const requestData = {
        base_subject: 'Check out what we have for you',
        lead_data: {
          name: 'John',
          company: 'Acme Corp',
          industry: 'Technology'
        },
        count: 3
      };

      const response = await request(app)
        .post('/api/email/ai/personalized-subject')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.personalized_variants)).toBe(true);
    });

    test('should incorporate lead data into subjects', async () => {
      const requestData = {
        base_subject: 'Welcome to our platform',
        lead_data: {
          name: 'Jane',
          role: 'Marketing Manager'
        }
      };

      const response = await request(app)
        .post('/api/email/ai/personalized-subject')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      const variants = response.body.data.personalized_variants;
      // At least one variant should reference the lead data
      const hasPersonalization = variants.some(v =>
        v.includes('Jane') || v.includes('Marketing Manager')
      );
      expect(hasPersonalization).toBe(true);
    });
  });

  describe('POST /api/email/ai/personalized-email', () => {
    test('should generate personalized email content', async () => {
      const requestData = {
        template_content: 'Hello {{lead.name}}, we have something for you',
        lead_data: {
          name: 'Bob',
          interests: ['technology', 'AI'],
          company_size: '50-100'
        }
      };

      const response = await request(app)
        .post('/api/email/ai/personalized-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('personalized_content');
    });
  });

  describe('POST /api/email/ai/optimal-send-time', () => {
    test('should predict optimal send time', async () => {
      const requestData = {
        audience_type: 'B2B',
        campaign_type: 'newsletter',
        timezone: 'UTC'
      };

      const response = await request(app)
        .post('/api/email/ai/optimal-send-time')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimal_time');
      expect(response.body.data).toHaveProperty('confidence_score');
    });
  });

  describe('POST /api/email/ai/analyze-performance', () => {
    test('should analyze email performance', async () => {
      const requestData = {
        subject: 'Summer Sale - 50% Off!',
        content: '<mj-text>Check out our sale</mj-text>',
        audience: 'existing_customers',
        historical_data: {
          open_rate: 0.25,
          click_rate: 0.05
        }
      };

      const response = await request(app)
        .post('/api/email/ai/analyze-performance')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis');
      expect(response.body.data).toHaveProperty('suggestions');
    });
  });

  describe('POST /api/email/ai/predict-engagement', () => {
    test('should predict engagement rates', async () => {
      const requestData = {
        subject: 'New Product Launch',
        content: '<mj-text>Exciting news!</mj-text>',
        audience: 'existing_customers',
        send_time: '2025-01-15T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/email/ai/predict-engagement')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('prediction');
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data.prediction).toHaveProperty('open_rate');
      expect(response.body.data.prediction).toHaveProperty('click_rate');
    });

    test('should validate prediction request', async () => {
      const requestData = {
        subject: 'Test'
        // Missing content
      };

      const response = await request(app)
        .post('/api/email/ai/predict-engagement')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Gemini API key', async () => {
      // Temporarily remove API key
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const response = await request(app)
        .post('/api/email/ai/generate-template')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ prompt: 'Test' });

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('not configured');

      // Restore
      process.env.GEMINI_API_KEY = originalKey;
    });

    test('should handle AI service errors', async () => {
      // Mock AI service failure
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API Error'));
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }));

      const response = await request(app)
        .post('/api/email/ai/generate-template')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ prompt: 'Test' });

      expect(response.status).toBe(500);
    });

    test('should handle rate limiting', async () => {
      // Mock multiple rapid requests
      const requests = Array(5).fill().map(() =>
        request(app)
          .post('/api/email/ai/generate-template')
          .set('Authorization', `Bearer ${managerToken}`)
          .send({ prompt: 'Test' })
      );

      const responses = await Promise.all(requests);
      // At least some requests should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });
});
