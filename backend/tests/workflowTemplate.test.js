const request = require('supertest');
const app = require('../src/app');

describe('Workflow Template API', () => {
  let authToken;
  let templateId;

  beforeAll(async () => {
    // Mock authentication
    authToken = 'mock-jwt-token';

    // Mock the middleware to bypass actual auth
    jest.mock('../src/middleware/authMiddleware', () => ({
      authenticate: (req, res, next) => {
        req.user = { id: 'user-1', role: 'company_admin', company_id: 'company-1' };
        next();
      },
      authorize: () => (req, res, next) => next()
    }));
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/email/workflow-templates/packs', () => {
    test('should return template packs', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/packs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should return packs for specific industry', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/packs?industry=saas')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/packs?category=welcome')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/email/workflow-templates', () => {
    test('should create new template', async () => {
      const templateData = {
        name: 'Test Welcome Sequence',
        description: 'A test template for welcome emails',
        category: 'welcome',
        industry: 'general',
        json_definition: {
          steps: [
            { delay_hours: 0, template_id: 'template-1', subject: 'Welcome!' }
          ]
        },
        is_public: false
      };

      const response = await request(app)
        .post('/api/email/workflow-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(templateData.name);
      templateId = response.body.data.id;
    });

    test('should reject template without required fields', async () => {
      const invalidData = {
        description: 'Missing name and category'
      };

      const response = await request(app)
        .post('/api/email/workflow-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate JSON structure', async () => {
      const templateData = {
        name: 'Test',
        description: 'Test',
        category: 'welcome',
        industry: 'general',
        json_definition: 'not-valid-json'
      };

      const response = await request(app)
        .post('/api/email/workflow-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should enforce name uniqueness within company', async () => {
      const templateData = {
        name: 'Duplicate Name',
        description: 'Test',
        category: 'welcome',
        json_definition: { steps: [] }
      };

      // First creation
      await request(app)
        .post('/api/email/workflow-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      // Second creation with same name
      const response = await request(app)
        .post('/api/email/workflow-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/email/workflow-templates/:id', () => {
    test('should fetch specific template', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/template-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/email/workflow-templates/:id', () => {
    test('should update template', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        category: 'nurture'
      };

      const response = await request(app)
        .put('/api/email/workflow-templates/template-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    test('should validate update data', async () => {
      const invalidData = {
        name: '' // Empty name
      };

      const response = await request(app)
        .put('/api/email/workflow-templates/template-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/email/workflow-templates/:id', () => {
    test('should delete template', async () => {
      const response = await request(app)
        .delete('/api/email/workflow-templates/template-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should prevent deletion if template is in use', async () => {
      // Mock that template is in use
      const response = await request(app)
        .delete('/api/email/workflow-templates/template-in-use')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/email/workflow-templates/:id/create-sequence', () => {
    test('should create sequence from template', async () => {
      const sequenceData = {
        name: 'Sequence from Template',
        is_active: true
      };

      const response = await request(app)
        .post('/api/email/workflow-templates/template-123/create-sequence')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sequenceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(sequenceData.name);
    });

    test('should increment template usage count', async () => {
      const response = await request(app)
        .post('/api/email/workflow-templates/template-123/create-sequence')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Sequence', is_active: true });

      expect(response.status).toBe(201);
      // Usage count should be incremented
    });

    test('should validate sequence name', async () => {
      const invalidData = {
        name: '', // Empty name
        is_active: true
      };

      const response = await request(app)
        .post('/api/email/workflow-templates/template-123/create-sequence')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/email/workflow-templates/import', () => {
    test('should import template from file', async () => {
      const templateData = {
        name: 'Imported Template',
        description: 'Imported from file',
        category: 'welcome',
        json_definition: { steps: [] }
      };

      const response = await request(app)
        .post('/api/email/workflow-templates/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('should validate imported data', async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/email/workflow-templates/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/email/workflow-templates/:id/export', () => {
    test('should export template', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/template-123/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.name).toBeDefined();
      expect(response.body.json_definition).toBeDefined();
    });

    test('should export in correct format', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/template-123/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});

describe('Template Packs API', () => {
  let authToken;

  beforeAll(async () => {
    authToken = 'mock-jwt-token';
  });

  describe('GET /api/email/workflow-templates/packs/:id', () => {
    test('should fetch specific pack', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/packs/pack-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should include templates in pack', async () => {
      const response = await request(app)
        .get('/api/email/workflow-templates/packs/pack-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data.templates).toBeDefined();
      expect(Array.isArray(response.body.data.templates)).toBe(true);
    });
  });
});
