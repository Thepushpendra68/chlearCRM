// End-to-End Test: Complete Template Workflow
const { test, expect } = require('@playwright/test');

test.describe('Workflow Template E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@company.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/app/dashboard');
  });

  test('complete workflow: create template -> use template -> create sequence', async ({ page }) => {
    // Step 1: Navigate to Workflow Library
    await page.click('[data-testid="email-section"]');
    await page.click('[data-testid="workflow-library-link"]');
    await expect(page.locator('h1')).toContainText('Workflow Library');

    // Step 2: Browse template packs
    await expect(page.locator('[data-testid="template-pack"]')).toBeVisible();

    // Step 3: Use a template pack to create sequence
    await page.click('[data-testid="use-template-pack"]:first-child');

    // Should navigate to sequence builder
    await expect(page.locator('h1')).toContainText('New Sequence');

    // Step 4: Verify template content is loaded
    await expect(page.locator('[data-testid="sequence-step"]')).toBeVisible();

    // Step 5: Save sequence
    await page.click('[data-testid="save-sequence-button"]');
    await expect(page.locator('.toast-success')).toContainText('Sequence saved');

    // Step 6: Navigate back to library and verify usage count incremented
    await page.goto('/app/email/workflow-library');
    await page.waitForSelector('[data-testid="template-pack"]');
    const usageCount = await page.locator('[data-testid="usage-count"]').first().textContent();
    expect(parseInt(usageCount)).toBeGreaterThan(0);
  });

  test('AI-assisted template creation workflow', async ({ page }) => {
    // Step 1: Navigate to email templates
    await page.goto('/app/email/templates');
    await page.click('[data-testid="new-template-button"]');

    // Step 2: Open AI toolbar
    await expect(page.locator('[data-testid="ai-toolbar"]')).toBeVisible();

    // Step 3: Generate template with AI
    await page.click('[data-testid="ai-generate-template"]');
    await page.fill('[data-testid="ai-prompt"]', 'Create a follow-up email for trial users');
    await page.selectOption('[data-testid="ai-tone"]', 'friendly');
    await page.click('[data-testid="ai-generate-button"]');

    // Wait for generation
    await page.waitForSelector('[data-testid="ai-generated-content"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="ai-generated-content"]')).toBeVisible();

    // Step 4: Optimize content
    await page.click('[data-testid="ai-optimize-content"]');
    await page.selectOption('[data-testid="optimization-goal"]', 'increase engagement');
    await page.click('[data-testid="ai-optimize-button"]');

    await page.waitForSelector('[data-testid="optimized-content"]');
    await expect(page.locator('[data-testid="optimized-content"]')).toBeVisible();

    // Step 5: Generate subject variants
    await page.click('[data-testid="ai-subject-variants"]');
    await page.click('[data-testid="generate-variants"]');

    await page.waitForSelector('[data-testid="variant-option"]');
    const variants = await page.locator('[data-testid="variant-option"]').count();
    expect(variants).toBeGreaterThan(0);

    // Step 6: Save template
    await page.fill('[data-testid="template-name"]', 'AI Generated Template');
    await page.click('[data-testid="save-template-button"]');
    await expect(page.locator('.toast-success')).toContainText('Template saved');
  });

  test('import/export template workflow', async ({ page }) => {
    // Step 1: Navigate to workflow library
    await page.goto('/app/email/workflow-library');
    await page.waitForSelector('[data-testid="workflow-library"]');

    // Step 2: Export existing template
    await page.click('[data-testid="export-template"]:first-child');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');

    // Step 3: Import template
    await page.click('[data-testid="import-template-button"]');

    // Create a test file
    const filePath = 'test-template.json';
    await page.evaluate(async (path) => {
      const data = {
        name: 'Imported Test Template',
        description: 'Imported via E2E test',
        category: 'welcome',
        json_definition: { steps: [] }
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const fs = require('fs');
      fs.writeFileSync(path, JSON.stringify(data));
    }, filePath);

    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('[data-testid="confirm-import"]');

    await expect(page.locator('.toast-success')).toContainText('Template imported');
  });

  test('template filtering and search', async ({ page }) => {
    // Step 1: Navigate to workflow library
    await page.goto('/app/email/workflow-library');
    await page.waitForSelector('[data-testid="workflow-library"]');

    // Step 2: Filter by category
    await page.selectOption('[data-testid="category-filter"]', 'welcome');
    await page.waitForLoadState('networkidle');

    // Verify only welcome templates shown
    const templates = await page.locator('[data-testid="template-card"]').count();
    expect(templates).toBeGreaterThan(0);

    // Step 3: Filter by industry
    await page.selectOption('[data-testid="industry-filter"]', 'saas');
    await page.waitForLoadState('networkidle');

    // Step 4: Search by name
    await page.fill('[data-testid="search-input"]', 'Welcome');
    await page.waitForLoadState('networkidle');

    // Verify search results
    const visibleTemplates = await page.locator('[data-testid="template-card"]:visible').count();
    expect(visibleTemplates).toBeGreaterThan(0);
  });

  test('multi-tenant template isolation', async ({ page }) => {
    // Step 1: Create template as company admin
    await page.goto('/app/email/workflow-library');
    await page.click('[data-testid="create-template-button"]');

    await page.fill('[data-testid="template-name"]', 'Company A Template');
    await page.fill('[data-testid="template-description"]', 'Private to company A');
    await page.click('[data-testid="save-template-button"]');

    await expect(page.locator('.toast-success')).toContainText('Template saved');

    // Step 2: Verify template is visible
    await page.goto('/app/email/workflow-library');
    await expect(page.locator('text=Company A Template')).toBeVisible();

    // Step 3: Logout and login as different company
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout"]');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@companyb.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/app/dashboard');

    // Step 4: Verify Company A template is NOT visible
    await page.goto('/app/email/workflow-library');
    const templates = await page.locator('text=Company A Template').count();
    expect(templates).toBe(0);
  });
});

test.describe('AI Email E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'manager@company.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/app/dashboard');
  });

  test('AI template generation workflow', async ({ page }) => {
    // Step 1: Create new template
    await page.goto('/app/email/templates/new');
    await expect(page.locator('h1')).toContainText('New Email Template');

    // Step 2: Use AI to generate content
    await page.click('[data-testid="ai-toolbar-trigger"]');

    await page.fill('[data-testid="ai-prompt"]', 'Create a welcome email for new SaaS customers');
    await page.selectOption('[data-testid="ai-industry"]', 'saas');
    await page.selectOption('[data-testid="ai-tone"]', 'professional');

    await page.click('[data-testid="ai-generate"]');

    // Wait for AI generation (can take time)
    await page.waitForSelector('[data-testid="generated-mjml"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="generated-mjml"]')).toContainText('<mjml>');

    // Step 3: Review generated subject
    await expect(page.locator('[data-testid="generated-subject"]')).toBeVisible();

    // Step 4: Optimize content
    await page.click('[data-testid="ai-optimize-trigger"]');
    await page.selectOption('[data-testid="optimization-goal"]', 'increase engagement');
    await page.click('[data-testid="ai-optimize-button"]');

    await page.waitForSelector('[data-testid="optimized-preview"]', { timeout: 15000 });

    // Step 5: Save template
    await page.fill('[data-testid="template-name"]', 'AI Generated Welcome');
    await page.fill('[data-testid="template-subject"]', 'Welcome to our platform!');
    await page.click('[data-testid="save-template"]');

    await expect(page.locator('.toast-success')).toContainText('Template saved');
  });

  test('AI subject line A/B testing', async ({ page }) => {
    // Step 1: Open template editor
    await page.goto('/app/email/templates/123/edit');

    // Step 2: Generate subject variants
    await page.click('[data-testid="ai-subject-variants"]');
    await page.fill('[data-testid="base-subject"]', 'Welcome to our platform!');
    await page.selectOption('[data-testid="variant-count"]', '5');

    await page.click('[data-testid="generate-variants"]');

    // Wait for variants
    await page.waitForSelector('[data-testid="variant-card"]', { timeout: 20000 });
    const variantCount = await page.locator('[data-testid="variant-card"]').count();
    expect(variantCount).toBe(5);

    // Step 3: Review each variant
    for (let i = 0; i < variantCount; i++) {
      const variant = page.locator('[data-testid="variant-card"]').nth(i);
      await expect(variant.locator('[data-testid="variant-text"]')).toBeVisible();
    }

    // Step 4: Select best variant
    await page.click('[data-testid="select-variant"]:first-child');

    // Step 5: Apply to template
    await page.click('[data-testid="apply-selected-variant"]');
    await expect(page.locator('[data-testid="template-subject"]')).toHaveValue(
      expect.stringContaining('Welcome')
    );
  });
});
