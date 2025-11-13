# Test Execution Guide

## 🚀 Quick Start

This guide explains how to run all the tests for the Workflow Library and AI Email features.

---

## Prerequisites

```bash
# Install dependencies for both frontend and backend
cd backend && npm install
cd ../frontend && npm install

# Install Playwright for E2E tests
cd ../tests
npm install @playwright/test
```

---

## Running Tests

### 1. Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm run test:workflow          # Workflow template tests
npm run test:ai                # AI email tests
npm test -- database.test.js   # Database tests

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### 2. Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests once (no watch mode)
npm test -- --watchAll=false

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- WorkflowLibrary.test.jsx
npm test -- EmailAiToolbar.test.jsx
```

### 3. End-to-End Tests

```bash
cd tests

# Install Playwright browsers
npx playwright install

# Run all E2E tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test template-workflow.spec.js

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Generate HTML report
npx playwright test --reporter=html
```

---

## Continuous Integration (CI)

The project includes a GitHub Actions workflow (`.github/workflows/test-suite.yml`) that runs:

✅ Backend API Tests
✅ Frontend Component Tests
✅ Database Integration Tests
✅ E2E Tests (Chrome, Firefox, Safari)
✅ AI Integration Tests
✅ Security Scans
✅ Lint & Format Checks
✅ Performance Tests

### Setting up CI for your repository

1. Copy the workflow file:
```bash
mkdir -p .github/workflows
cp tests/github/test-suite.yml .github/workflows/test-suite.yml
```

2. Add required secrets in GitHub repository settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

3. Commit and push:
```bash
git add .github/workflows/test-suite.yml
git commit -m "ci: Add comprehensive test suite"
git push
```

---

## Test Coverage Goals

| Area | Current | Target |
|------|---------|--------|
| Backend (Controllers & Services) | ~60% | **95%** |
| Frontend (Components) | ~50% | **90%** |
| Database (Schema & Queries) | - | **100%** |
| E2E (Critical Paths) | - | **100%** |

---

## Manual Testing Checklist

### Workflow Library

- [ ] Navigate to `/app/email/workflow-library`
- [ ] View template packs
- [ ] Filter by category (welcome, nurture, etc.)
- [ ] Filter by industry (saas, ecommerce, etc.)
- [ ] Search templates by name
- [ ] Click "Use Template" on a template
- [ ] Verify redirect to sequence builder
- [ ] Import template from JSON file
- [ ] Export template to JSON file
- [ ] Check usage count increments

### AI Email Features

- [ ] Navigate to `/app/email/templates/new`
- [ ] Click "AI Assistant" toolbar
- [ ] Generate template from prompt
- [ ] Optimize existing content
- [ ] Generate subject line variants
- [ ] Suggest merge variables
- [ ] Copy generated content
- [ ] Save template

### Database

```sql
-- Verify tables exist
SELECT * FROM workflow_templates LIMIT 1;
SELECT * FROM workflow_template_packs LIMIT 1;

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('workflow_templates', 'workflow_template_packs');
```

---

## Debugging Tests

### Backend Tests

```bash
# Run specific test with full output
npm test -- workflowTemplate.test.js --verbose

# Run test with debugger
node --inspect-brk node_modules/.bin/jest --runInBand workflowTemplate.test.js

# Check test setup
cat tests/setup.js
```

### Frontend Tests

```bash
# Run in watch mode with UI
npm test -- --watch

# Debug in browser
npm test -- --inspect-brk
# Then open chrome://inspect in browser
```

### E2E Tests

```bash
# Run with debug output
DEBUG=pw:api npx playwright test

# Show browser while running
npx playwright test --headed --slow-mo=1000

# Record test run
npx playwright test --video=on
```

---

## Common Issues & Solutions

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection errors

**Solution:**
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Run tests with test database
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db npm test
```

### Issue: AI tests failing (API key)

**Solution:**
```bash
# Set test API key
export GEMINI_API_KEY=test-key

# Or mock the AI service
npm test -- --testNamePattern="should return mock"
```

### Issue: E2E tests timing out

**Solution:**
```bash
# Increase timeout
npx playwright test --timeout=60000

# Run tests sequentially
npx playwright test --workers=1
```

### Issue: Tests pass locally but fail in CI

**Solution:**
1. Check environment variables are set
2. Increase timeouts for slower CI environments
3. Use `waitForSelector` instead of `waitForTimeout`
4. Check for race conditions

---

## Performance Benchmarks

### API Response Times (95th percentile)

| Endpoint | Target | Current |
|----------|--------|---------|
| GET /workflow-templates | < 200ms | - |
| POST /workflow-templates | < 500ms | - |
| GET /workflow-templates/packs | < 200ms | - |
| POST /ai/generate-template | < 10s | - |
| POST /ai/optimize-content | < 5s | - |
| POST /ai/subject-variants | < 3s | - |

### Database Query Performance

| Query | Target | Current |
|-------|--------|---------|
| Filter by category | < 50ms | - |
| Filter by industry | < 50ms | - |
| Search by name (ILIKE) | < 100ms | - |
| Join workflow_templates with company | < 100ms | - |

---

## Test Data Management

### Seed Test Data

```bash
# Backend
cd backend
npm run seed:test

# Or manually via SQL
psql $DATABASE_URL -c "
  INSERT INTO workflow_templates (name, category, json_definition)
  VALUES ('Test Template', 'welcome', '{\"steps\": []}');
"
```

### Cleanup Test Data

```bash
# After tests
npm test -- --cleanup

# Or manual cleanup
psql $DATABASE_URL -c "DELETE FROM workflow_templates WHERE name LIKE 'Test%';"
```

---

## Mock Data Templates

### Sample Workflow Template

```json
{
  "name": "SaaS Welcome Sequence",
  "description": "Welcome new SaaS customers",
  "category": "welcome",
  "industry": "saas",
  "json_definition": {
    "name": "Welcome Sequence",
    "steps": [
      {
        "delay_hours": 0,
        "email_template_id": "template-1",
        "subject": "Welcome to our platform!",
        "mjml": "<mj-text>Welcome!</mj-text>"
      },
      {
        "delay_hours": 24,
        "email_template_id": "template-2",
        "subject": "Getting Started",
        "mjml": "<mj-text>Getting started guide</mj-text>"
      }
    ]
  },
  "tags": ["welcome", "onboarding"],
  "is_public": false
}
```

### Sample AI Request

```json
{
  "prompt": "Create a welcome email for new SaaS customers",
  "tone": "professional",
  "industry": "saas",
  "email_type": "welcome"
}
```

---

## Continuous Improvement

### Adding New Tests

1. **Backend API**: Add to `tests/workflowTemplate.test.js` or `tests/aiEmail.test.js`
2. **Frontend Component**: Add to `tests/ComponentName.test.jsx`
3. **Database**: Add to `tests/database.test.js`
4. **E2E**: Add to `tests/e2e/workflow-name.spec.js`

### Test Metrics to Track

- [ ] Test count over time
- [ ] Flaky test rate
- [ ] Average test execution time
- [ ] Coverage trends
- [ ] Bug detection rate

---

## Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **Supertest API**: https://github.com/visionmedia/supertest

---

## Support

For questions or issues:
- Check existing GitHub issues
- Review test output and logs
- Ask in team Slack #testing channel

---

**Last Updated**: November 2025
**Version**: 1.0.0
