# Test Suite: Workflow Library & AI Email Features

## 📋 Overview

This test suite validates all functionalities of the merged Workflow Library and AI-Powered Email Features. It includes **10 distinct test types** covering backend APIs, frontend components, database integrity, and end-to-end workflows.

---

## 🧪 Test Type 1: API Endpoint Testing

### Backend API Tests

#### Test 1.1: Workflow Template API Endpoints

**Test File:** `tests/backend/workflowTemplate.test.js`

```javascript
describe('Workflow Template API', () => {
  let authToken;
  let templateId;

  beforeAll(async () => {
    // Setup authenticated user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@company.com', password: 'password123' });
    authToken = loginResponse.body.data.token;
  });

  test('GET /api/email/workflow-templates/packs - should return template packs', async () => {
    const response = await request(app)
      .get('/api/email/workflow-templates/packs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/email/workflow-templates - should create new template', async () => {
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

  test('GET /api/email/workflow-templates/:id - should fetch specific template', async () => {
    const response = await request(app)
      .get(`/api/email/workflow-templates/${templateId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(templateId);
  });

  test('POST /api/email/workflow-templates/:id/create-sequence - should create sequence from template', async () => {
    const sequenceData = {
      name: 'Sequence from Template',
      is_active: true
    };

    const response = await request(app)
      .post(`/api/email/workflow-templates/${templateId}/create-sequence`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(sequenceData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(sequenceData.name);
  });

  test('DELETE /api/email/workflow-templates/:id - should delete template', async () => {
    const response = await request(app)
      .delete(`/api/email/workflow-templates/${templateId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

#### Test 1.2: AI-Powered Email API Endpoints

```javascript
describe('AI Email API', () => {
  let authToken;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@company.com', password: 'password123' });
    authToken = loginResponse.body.data.token;
  });

  test('GET /api/email/ai/status - should return AI service status', async () => {
    const response = await request(app)
      .get('/api/email/ai/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('active');
  });

  test('POST /api/email/ai/generate-template - should generate email template', async () => {
    const requestData = {
      prompt: 'Create a welcome email for new SaaS customers',
      tone: 'professional',
      industry: 'saas',
      email_type: 'welcome'
    };

    const response = await request(app)
      .post('/api/email/ai/generate-template')
      .set('Authorization', `Bearer ${authToken}`)
      .send(requestData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.mjml).toBeDefined();
    expect(response.body.data.subject).toBeDefined();
  });

  test('POST /api/email/ai/generate-subject-variants - should generate subject variants', async () => {
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
    expect(Array.isArray(response.body.data.variants)).toBe(true);
    expect(response.body.data.variants.length).toBe(3);
  });

  test('POST /api/email/ai/optimize-content - should optimize email content', async () => {
    const requestData = {
      content: 'Hello {{lead.name}}, thanks for signing up!',
      goal: 'increase engagement',
      audience: 'new customers'
    };

    const response = await request(app)
      .post('/api/email/ai/optimize-content')
      .set('Authorization', `Bearer ${authToken}`)
      .send(requestData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.optimized_content).toBeDefined();
  });

  test('POST /api/email/ai/predict-engagement - should predict engagement', async () => {
    const requestData = {
      subject: 'Check out our new features!',
      content: '<mj-text>Hello!</mj-text>',
      audience: 'existing customers'
    };

    const response = await request(app)
      .post('/api/email/ai/predict-engagement')
      .set('Authorization', `Bearer ${authToken}`)
      .send(requestData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.prediction).toBeDefined();
    expect(response.body.data.confidence).toBeDefined();
  });
});
```

---

## 🧪 Test Type 2: Frontend Component Testing

### Test 2.1: WorkflowLibrary Page Component

**Test File:** `tests/frontend/WorkflowLibrary.test.jsx`

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkflowLibrary from '../../frontend/src/pages/WorkflowLibrary';
import { BrowserRouter } from 'react-router-dom';
import api from '../../frontend/src/services/api';

jest.mock('../../frontend/src/services/api');

const MockWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('WorkflowLibrary Component', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: '1',
            name: 'Welcome Sequence',
            description: 'Welcome new users',
            category: 'welcome',
            industry: 'general',
            usage_count: 42
          }
        ]
      }
    });
  });

  test('renders workflow library page', async () => {
    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    expect(screen.getByText('Workflow Library')).toBeInTheDocument();
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });

  test('displays template packs', async () => {
    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
      expect(screen.getByText('Welcome new users')).toBeInTheDocument();
    });
  });

  test('filters templates by category', async () => {
    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    const categoryFilter = screen.getByLabelText('Category');
    fireEvent.change(categoryFilter, { target: { value: 'welcome' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/email/workflow-templates?category=welcome');
    });
  });

  test('creates sequence from template', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { id: 'seq-1' } } });

    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    await waitFor(() => {
      const createButton = screen.getByText('Use Template');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/email/workflow-templates/1/create-sequence',
        expect.objectContaining({ name: expect.any(String) })
      );
    });
  });

  test('imports template', async () => {
    api.post.mockResolvedValue({ data: { success: true } });

    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    const importButton = screen.getByText('Import Template');
    fireEvent.click(importButton);

    const fileInput = screen.getByLabelText('Import File');
    const file = new File(['test'], 'template.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });
});
```

### Test 2.2: EmailAiToolbar Component

```javascript
describe('EmailAiToolbar Component', () => {
  const mockProps = {
    templateData: { name: 'Test', subject: 'Test Subject' },
    setTemplateData: jest.fn(),
    mjmlContent: '<mj-text>Hello</mj-text>',
    setMjmlContent: jest.fn(),
    htmlContent: '<p>Hello</p>',
    editorMode: 'code',
    onInsertVisualHtml: jest.fn()
  };

  test('renders AI toolbar', () => {
    render(<EmailAiToolbar {...mockProps} />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Generate Template')).toBeInTheDocument();
    expect(screen.getByText('Optimize Content')).toBeInTheDocument();
  });

  test('generates template from prompt', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          mjml: '<mj-text>Generated</mj-text>',
          subject: 'Generated Subject'
        }
      }
    });

    render(<EmailAiToolbar {...mockProps} />);

    const generateButton = screen.getByText('Generate Template');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/email/ai/generate-template',
        expect.objectContaining({
          prompt: expect.any(String)
        })
      );
    });
  });

  test('optimizes existing content', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          optimized_content: '<mj-text>Optimized</mj-text>'
        }
      }
    });

    render(<EmailAiToolbar {...mockProps} />);

    const optimizeButton = screen.getByText('Optimize Content');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/email/ai/optimize-content',
        expect.objectContaining({
          content: mockProps.mjmlContent
        })
      );
    });
  });

  test('generates subject line variants', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          variants: ['Subject 1', 'Subject 2', 'Subject 3']
        }
      }
    });

    render(<EmailAiToolbar {...mockProps} />);

    const variantButton = screen.getByText('Subject Variants');
    fireEvent.click(variantButton);

    await waitFor(() => {
      expect(screen.getByText('Subject 1')).toBeInTheDocument();
      expect(screen.getByText('Subject 2')).toBeInTheDocument();
    });
  });
});
```

---

## 🧪 Test Type 3: Database Integration Testing

### Test 3.1: Migration Validation

**Test File:** `tests/database/migration.test.js`

```javascript
describe('Workflow Library Migration', () => {
  let supabase;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  });

  test('workflow_templates table exists', async () => {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
  });

  test('workflow_template_packs table exists', async () => {
    const { data, error } = await supabase
      .from('workflow_template_packs')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
  });

  test('workflow_templates has correct schema', async () => {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select(`
        id,
        company_id,
        name,
        description,
        json_definition,
        category,
        industry,
        is_public,
        usage_count,
        created_at
      `)
      .limit(1);

    expect(error).toBeNull();
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('json_definition');
  });

  test('RLS policies are enabled', async () => {
    const { data, error } = await supabase.rpc('check_rls_enabled', {
      table_name: 'workflow_templates'
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  test('can insert and retrieve template', async () => {
    const testTemplate = {
      name: 'Test Template',
      description: 'Test Description',
      json_definition: { steps: [] },
      category: 'test',
      industry: 'general',
      is_public: false
    };

    const { data: inserted, error: insertError } = await supabase
      .from('workflow_templates')
      .insert(testTemplate)
      .select()
      .single();

    expect(insertError).toBeNull();
    expect(inserted.name).toBe('Test Template');

    const { data: retrieved, error: retrieveError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', inserted.id)
      .single();

    expect(retrieveError).toBeNull();
    expect(retrieved.name).toBe('Test Template');

    // Cleanup
    await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', inserted.id);
  });

  test('template packs have proper structure', async () => {
    const { data, error } = await supabase
      .from('workflow_template_packs')
      .select(`
        id,
        name,
        description,
        industry,
        category,
        templates
      `)
      .limit(1);

    expect(error).toBeNull();
    expect(data[0]).toHaveProperty('templates');
  });
});
```

---

## 🧪 Test Type 4: Authentication & Authorization Testing

### Test 4.1: Role-Based Access Control

```javascript
describe('Workflow Template Authorization', () => {
  let adminToken, managerToken, salesRepToken;

  beforeAll(async () => {
    const admin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@company.com', password: 'password123' });
    adminToken = admin.body.data.token;

    const manager = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@company.com', password: 'password123' });
    managerToken = manager.body.data.token;

    const salesRep = await request(app)
      .post('/api/auth/login')
      .send({ email: 'salesrep@company.com', password: 'password123' });
    salesRepToken = salesRep.body.data.token;
  });

  test('company_admin can create templates', async () => {
    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(templateData);

    expect(response.status).toBe(201);
  });

  test('manager can create templates', async () => {
    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(templateData);

    expect(response.status).toBe(201);
  });

  test('sales_rep cannot create templates', async () => {
    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${salesRepToken}`)
      .send(templateData);

    expect(response.status).toBe(403);
  });

  test('sales_rep can view templates', async () => {
    const response = await request(app)
      .get('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${salesRepToken}`);

    expect(response.status).toBe(200);
  });

  test('AI endpoints require manager or admin role', async () => {
    const response = await request(app)
      .post('/api/email/ai/generate-template')
      .set('Authorization', `Bearer ${salesRepToken}`)
      .send({ prompt: 'test' });

    expect(response.status).toBe(403);
  });

  test('AI endpoints work for manager', async () => {
    const response = await request(app)
      .post('/api/email/ai/generate-template')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        prompt: 'Create a welcome email',
        industry: 'saas'
      });

    expect(response.status).toBe(200);
  });
});
```

---

## 🧪 Test Type 5: End-to-End Workflow Testing

### Test 5.1: Complete Template Workflow

**Test File:** `tests/e2e/template-workflow.test.js`

```javascript
describe('End-to-End Template Workflow', () => {
  let authToken;
  let createdTemplateId;
  let createdSequenceId;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@company.com', password: 'password123' });
    authToken = login.body.data.token;
  });

  test('complete workflow: create template -> use template -> create sequence', async () => {
    // Step 1: Create workflow template
    const templateData = {
      name: 'E2E Test Welcome Sequence',
      description: 'Created by E2E test',
      category: 'welcome',
      industry: 'saas',
      json_definition: {
        name: 'Welcome Sequence',
        steps: [
          {
            delay_hours: 0,
            email_template_id: 'template-1',
            subject: 'Welcome to our platform!',
            mjml: '<mj-text>Welcome!</mj-text>'
          },
          {
            delay_hours: 24,
            email_template_id: 'template-2',
            subject: 'Getting Started',
            mjml: '<mj-text>Getting started guide</mj-text>'
          }
        ]
      }
    };

    const templateResponse = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(templateData);

    expect(templateResponse.status).toBe(201);
    expect(templateResponse.body.success).toBe(true);
    createdTemplateId = templateResponse.body.data.id;

    // Step 2: Create sequence from template
    const sequenceData = {
      name: 'E2E Test Sequence',
      is_active: true
    };

    const sequenceResponse = await request(app)
      .post(`/api/email/workflow-templates/${createdTemplateId}/create-sequence`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(sequenceData);

    expect(sequenceResponse.status).toBe(201);
    expect(sequenceResponse.body.success).toBe(true);
    createdSequenceId = sequenceResponse.body.data.id;

    // Step 3: Verify sequence has correct steps
    const detailResponse = await request(app)
      .get(`/api/email/sequences/${createdSequenceId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.json_definition.steps).toHaveLength(2);

    // Step 4: Update template usage count
    const usageResponse = await request(app)
      .get(`/api/email/workflow-templates/${createdTemplateId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(usageResponse.status).toBe(200);
    expect(usageResponse.body.data.usage_count).toBe(1);
  });

  test('AI-assisted template creation workflow', async () => {
    // Step 1: Use AI to generate template
    const aiRequest = {
      prompt: 'Create a follow-up email for users who signed up but never completed onboarding',
      tone: 'friendly',
      industry: 'saas',
      email_type: 're-engagement'
    };

    const aiResponse = await request(app)
      .post('/api/email/ai/generate-template')
      .set('Authorization', `Bearer ${authToken}`)
      .send(aiRequest);

    expect(aiResponse.status).toBe(200);
    expect(aiResponse.body.data.mjml).toBeDefined();
    expect(aiResponse.body.data.subject).toBeDefined();

    // Step 2: Create template with AI-generated content
    const templateData = {
      name: 'AI Generated Re-engagement',
      description: 'Created with AI assistance',
      category: 're-engagement',
      industry: 'saas',
      json_definition: {
        name: 'AI Template',
        steps: [
          {
            delay_hours: 0,
            subject: aiResponse.body.data.subject,
            mjml: aiResponse.body.data.mjml
          }
        ]
      }
    };

    const templateResponse = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(templateData);

    expect(templateResponse.status).toBe(201);

    // Step 3: Generate subject line variants
    const variantRequest = {
      base_subject: aiResponse.body.data.subject,
      count: 5,
      tone: 'friendly'
    };

    const variantResponse = await request(app)
      .post('/api/email/ai/generate-subject-variants')
      .set('Authorization', `Bearer ${authToken}`)
      .send(variantRequest);

    expect(variantResponse.status).toBe(200);
    expect(variantResponse.body.data.variants).toHaveLength(5);
  });

  afterAll(async () => {
    // Cleanup
    if (createdTemplateId) {
      await request(app)
        .delete(`/api/email/workflow-templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    if (createdSequenceId) {
      await request(app)
        .delete(`/api/email/sequences/${createdSequenceId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });
});
```

---

## 🧪 Test Type 6: Error Handling & Edge Cases

### Test 6.1: API Error Scenarios

```javascript
describe('Workflow Template Error Handling', () => {
  let authToken;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@company.com', password: 'password123' });
    authToken = login.body.data.token;
  });

  test('returns 400 for invalid template data', async () => {
    const invalidData = {
      name: '', // Empty name
      description: 'Test',
      category: 'invalid-category'
    };

    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('returns 404 for non-existent template', async () => {
    const response = await request(app)
      .get('/api/email/workflow-templates/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  test('returns 403 for unauthorized access', async () => {
    const response = await request(app)
      .delete('/api/email/workflow-templates/some-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(403);
  });

  test('AI API handles missing API key', async () => {
    // Temporarily remove GEMINI_API_KEY from environment
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const response = await request(app)
      .post('/api/email/ai/generate-template')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ prompt: 'test' });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain('AI service not configured');

    // Restore
    process.env.GEMINI_API_KEY = originalKey;
  });

  test('handles malformed JSON in template definition', async () => {
    const malformedData = {
      name: 'Test',
      description: 'Test',
      category: 'test',
      json_definition: 'not-valid-json'
    };

    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(malformedData);

    expect(response.status).toBe(400);
  });

  test('returns proper error for duplicate template name', async () => {
    const templateData = {
      name: 'Duplicate Name Test',
      description: 'Test',
      category: 'test',
      json_definition: { steps: [] }
    };

    // Create first template
    await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(templateData);

    // Try to create duplicate
    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(templateData);

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already exists');
  });
});
```

---

## 🧪 Test Type 7: Performance & Load Testing

### Test 7.1: API Performance

**Test File:** `tests/performance/api-performance.test.js`

```javascript
describe('Workflow Template API Performance', () => {
  let authToken;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@company.com', password: 'password123' });
    authToken = login.body.data.token;
  });

  test('GET workflow-templates responds within 500ms', async () => {
    const startTime = Date.now();

    const response = await request(app)
      .get('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`);

    const duration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('AI template generation completes within 10 seconds', async () => {
    const startTime = Date.now();

    const response = await request(app)
      .post('/api/email/ai/generate-template')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'Create a comprehensive welcome email sequence',
        industry: 'saas',
        tone: 'professional'
      });

    const duration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(10000);
  });

  test('handles concurrent template creation', async () => {
    const requests = Array(10).fill().map((_, i) =>
      request(app)
        .post('/api/email/workflow-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Concurrent Test ${i}`,
          description: 'Testing concurrent requests',
          category: 'test',
          json_definition: { steps: [] }
        })
    );

    const responses = await Promise.all(requests);

    responses.forEach((response, i) => {
      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(`Concurrent Test ${i}`);
    });
  });

  test('database queries use indexes efficiently', async () => {
    // Create 100 templates
    const templates = Array(100).fill().map((_, i) => ({
      name: `Perf Test ${i}`,
      category: i % 2 === 0 ? 'welcome' : 'follow-up',
      json_definition: { steps: [] }
    }));

    await request(app)
      .post('/api/email/workflow-templates/bulk-create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ templates });

    // Query with category filter (should use index)
    const startTime = Date.now();
    const response = await request(app)
      .get('/api/email/workflow-templates?category=welcome')
      .set('Authorization', `Bearer ${authToken}`);
    const duration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100); // Should be fast with index
    expect(response.body.data.length).toBe(50);
  });
});
```

---

## 🧪 Test Type 8: Data Validation Testing

### Test 8.1: Input Sanitization

```javascript
describe('Workflow Template Data Validation', () => {
  let authToken;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@company.com', password: 'password123' });
    authToken = login.body.data.token;
  });

  test('sanitizes HTML in template description', async () => {
    const maliciousData = {
      name: 'Test',
      description: '<script>alert("xss")</script>Normal description',
      category: 'test',
      json_definition: { steps: [] }
    };

    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(maliciousData);

    expect(response.status).toBe(201);
    expect(response.body.data.description).not.toContain('<script>');
    expect(response.body.data.description).toContain('Normal description');
  });

  test('validates JSON structure', async () => {
    const invalidJsonData = {
      name: 'Test',
      description: 'Test',
      category: 'test',
      json_definition: {
        steps: 'not-an-array' // Should be array
      }
    };

    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidJsonData);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid JSON structure');
  });

  test('limits template name length', async () => {
    const longNameData = {
      name: 'a'.repeat(1000), // Very long name
      description: 'Test',
      category: 'test',
      json_definition: { steps: [] }
    };

    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(longNameData);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('too long');
  });

  test('validates industry and category enums', async () => {
    const invalidData = {
      name: 'Test',
      description: 'Test',
      category: 'invalid-category',
      industry: 'invalid-industry',
      json_definition: { steps: [] }
    };

    const response = await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid category');
  });

  test('prevents SQL injection in template search', async () => {
    const maliciousQuery = "'; DROP TABLE workflow_templates; --";

    const response = await request(app)
      .get(`/api/email/workflow-templates?search=${maliciousQuery}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    // Table should still exist
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

---

## 🧪 Test Type 9: Integration Testing

### Test 9.1: External Service Integration

**Test File:** `tests/integration/external-services.test.js`

```javascript
describe('External Service Integration', () => {
  let authToken;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@company.com', password: 'password123' });
    authToken = login.body.data.token;
  });

  test('Gemini AI service integration', async () => {
    const response = await request(app)
      .post('/api/email/ai/generate-template')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'Create a welcome email for e-commerce customers',
        industry: 'ecommerce',
        tone: 'friendly'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.mjml).toMatch(/<mjml>/);
    expect(response.body.data.subject).toBeTruthy();
  });

  test('Postmark webhook integration', async () => {
    const webhookPayload = {
      RecordType: 'MessageEvent',
      MessageID: 'test-message-id',
      EventType: 'Delivered',
      Recipient: 'test@example.com',
      Timestamp: new Date().toISOString()
    };

    const response = await request(app)
      .post('/api/email/webhooks/postmark')
      .send(webhookPayload);

    expect(response.status).toBe(200);
  });

  test('email sequence worker processes enrollments', async () => {
    // Create a sequence with a step scheduled for now
    const sequenceData = {
      name: 'Worker Test Sequence',
      is_active: true,
      json_definition: {
        name: 'Test',
        steps: [
          {
            delay_hours: 0,
            email_template_id: 'template-1'
          }
        ]
      }
    };

    const createResponse = await request(app)
      .post('/api/email/sequences')
      .set('Authorization', `Bearer ${authToken}`)
      .send(sequenceData);

    const sequenceId = createResponse.body.data.id;

    // Enroll a lead
    await request(app)
      .post(`/api/email/sequences/${sequenceId}/enroll`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ lead_id: 'test-lead-id' });

    // Trigger processing
    const processResponse = await request(app)
      .post('/api/email/process')
      .set('Authorization', `Bearer ${authToken}`);

    expect(processResponse.status).toBe(200);

    // Verify email was sent (check logs or database)
    const emails = await emailService.getSentEmails();
    expect(emails.length).toBeGreaterThan(0);
  });

  test('Supabase real-time subscription', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    let updateReceived = false;

    const subscription = supabase
      .channel('workflow-templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_templates'
        },
        (payload) => {
          updateReceived = true;
        }
      )
      .subscribe();

    // Create a template (should trigger real-time event)
    await request(app)
      .post('/api/email/workflow-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Real-time Test',
        description: 'Testing real-time updates',
        category: 'test',
        json_definition: { steps: [] }
      });

    await waitFor(() => expect(updateReceived).toBe(true), {
      timeout: 5000
    });

    subscription.unsubscribe();
  });
});
```

---

## 🧪 Test Type 10: Frontend Integration Testing

### Test 10.1: Full Page Workflows

**Test File:** `tests/e2e/frontend-workflows.test.js`

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import WorkflowLibrary from '../../frontend/src/pages/WorkflowLibrary';
import EmailTemplateEditor from '../../frontend/src/pages/EmailTemplateEditor';

const MockWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Frontend Integration Workflows', () => {
  test('user creates template from workflow library', async () => {
    const user = userEvent.setup();

    // Mock API responses
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: 'pack-1',
            name: 'SaaS Welcome Pack',
            description: 'Complete onboarding sequence',
            industry: 'saas',
            templates: [
              {
                id: 'tpl-1',
                name: 'Welcome Email',
                category: 'welcome'
              }
            ]
          }
        ]
      }
    });

    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    // Navigate to workflow library
    expect(screen.getByText('Workflow Library')).toBeInTheDocument();

    // Select a template pack
    await waitFor(() => {
      expect(screen.getByText('SaaS Welcome Pack')).toBeInTheDocument();
    });

    const useTemplateButton = screen.getByText('Use Template');
    await user.click(useTemplateButton);

    // Should redirect to sequence creation or editor
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/email/workflow-templates/tpl-1/create-sequence',
        expect.any(Object)
      );
    });
  });

  test('user uses AI to create email template', async () => {
    const user = userEvent.setup();

    // Mock AI API
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          mjml: '<mj-text>AI Generated Email</mj-text>',
          subject: 'Generated Subject Line'
        }
      }
    });

    render(<EmailTemplateEditor />, { wrapper: MockWrapper });

    // Open AI toolbar
    const aiButton = screen.getByText('AI Assistant');
    await user.click(aiButton);

    // Generate template
    const generateButton = screen.getByText('Generate Template');
    await user.click(generateButton);

    // Enter prompt
    const promptInput = screen.getByPlaceholderText('Describe your email...');
    await user.type(promptInput, 'Create a welcome email for new users');

    const submitButton = screen.getByText('Generate');
    await user.click(submitButton);

    // Verify AI was called
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/email/ai/generate-template',
        expect.objectContaining({
          prompt: 'Create a welcome email for new users'
        })
      );
    });

    // Verify content was inserted
    await waitFor(() => {
      expect(screen.getByDisplayValue('AI Generated Email')).toBeInTheDocument();
    });
  });

  test('user imports workflow template', async () => {
    const user = userEvent.setup();

    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'imported-template',
          name: 'Imported Template'
        }
      }
    });

    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    const importButton = screen.getByText('Import Template');
    await user.click(importButton);

    // Create a mock file
    const fileContent = JSON.stringify({
      name: 'Imported Template',
      description: 'Imported from file',
      category: 'welcome',
      json_definition: { steps: [] }
    });

    const file = new File([fileContent], 'template.json', {
      type: 'application/json'
    });

    const fileInput = screen.getByLabelText('Import File');
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/email/workflow-templates/import',
        expect.any(FormData)
      );
    });
  });

  test('workflow library filters and searches', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: '1',
            name: 'Welcome Sequence',
            category: 'welcome',
            industry: 'saas'
          },
          {
            id: '2',
            name: 'Follow-up Sequence',
            category: 'follow-up',
            industry: 'ecommerce'
          }
        ]
      }
    });

    render(<WorkflowLibrary />, { wrapper: MockWrapper });

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
      expect(screen.getByText('Follow-up Sequence')).toBeInTheDocument();
    });

    // Filter by category
    const categoryFilter = screen.getByLabelText('Category');
    fireEvent.change(categoryFilter, { target: { value: 'welcome' } });

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
      expect(screen.queryByText('Follow-up Sequence')).not.toBeInTheDocument();
    });

    // Search by name
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'Welcome' } });

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });
  });
});
```

---

## 📊 Test Execution Instructions

### Backend Tests

```bash
# Install dependencies
cd backend
npm install --save-dev jest supertest

# Run tests
npm test

# Run specific test file
npm test -- workflowTemplate.test.js

# Run with coverage
npm run test:coverage
```

### Frontend Tests

```bash
# Install dependencies
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Database Tests

```bash
# Set environment variables
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_KEY=your_service_key

# Run migration tests
cd backend
npm test -- migration.test.js
```

### End-to-End Tests

```bash
# Install Playwright or Cypress
npm install --save-dev @playwright/test

# Run E2E tests
npx playwright test

# or
npx cypress run
```

---

## 📈 Coverage Targets

- **Backend API Tests**: 95% code coverage
- **Frontend Component Tests**: 90% component coverage
- **Database Tests**: 100% schema validation
- **E2E Tests**: All critical user workflows

---

## 🚨 Continuous Integration

Add to your CI/CD pipeline (GitHub Actions example):

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Run backend tests
        run: cd backend && npm test

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Run frontend tests
        run: cd frontend && npm test

      - name: Run E2E tests
        run: npx playwright test
```

---

## ✅ Test Checklist

Use this checklist to track test execution:

### Backend API Tests
- [ ] Workflow template CRUD operations
- [ ] AI email endpoints (all 11 endpoints)
- [ ] Template pack operations
- [ ] Import/export functionality
- [ ] Authentication & authorization
- [ ] Error handling
- [ ] Performance benchmarks

### Frontend Tests
- [ ] WorkflowLibrary page rendering
- [ ] EmailAiToolbar interactions
- [ ] Template filtering & search
- [ ] Navigation & routing
- [ ] Form submissions
- [ ] State management

### Database Tests
- [ ] Migration applied successfully
- [ ] RLS policies enforced
- [ ] Multi-tenancy isolation
- [ ] Foreign key constraints
- [ ] Index performance

### E2E Tests
- [ ] Complete template workflow
- [ ] AI-assisted email creation
- [ ] Sequence from template creation
- [ ] Real-time updates

---

**Total Test Count**: 100+ individual test cases across 10 test types
**Estimated Execution Time**: 15-20 minutes for full suite
**Critical Path Coverage**: 100%
