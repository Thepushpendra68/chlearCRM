# Custom Fields Testing Guide

Comprehensive testing documentation for custom fields functionality in the CRM.

## 📋 Table of Contents
- [Overview](#overview)
- [Test Files](#test-files)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Manual Testing](#manual-testing)

## 🎯 Overview

This guide covers all tests for the custom fields feature, including:
- Backend API endpoint tests
- Frontend UI component tests
- API authentication tests
- Integration tests
- End-to-end scenarios

## 📁 Test Files

### Backend Tests

#### 1. **leadCaptureController.test.js**
Tests the lead capture API endpoints with custom fields support.

**Location:** `backend/src/__tests__/leadCaptureController.test.js`

**Test Suites:**
- ✅ `captureLead` - Single lead capture
  - Success cases (basic fields, custom fields, field mapping)
  - Error cases (missing fields, validation)
  - Custom field types (boolean, numeric, string)
  
- ✅ `captureBulkLeads` - Bulk lead capture
  - Multiple leads with custom fields
  - Partial failures handling
  - Validation limits (max 100 leads)
  
- ✅ `getApiInfo` - API client information
  - Returns client configuration
  - Indicates custom field mapping status
  
- ✅ `Custom Field Mapping Logic`
  - Multiple field mappings
  - Preserves unmapped fields
  - Correct transformation

**Key Test Cases:**
```javascript
// Example: Custom fields with mapping
it('should apply custom field mapping when configured', async () => {
  req.apiClient.custom_field_mapping = {
    company_name: 'company',
    contact_phone: 'phone'
  };
  
  req.body = {
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob@example.com',
    custom_fields: {
      company_name: 'Acme Corp',
      contact_phone: '+1234567890',
      budget: '$100k'
    }
  };
  
  // Expects correct mapping: company_name → company, contact_phone → phone
});
```

#### 2. **apiKeyMiddleware.test.js**
Tests API authentication and logging middleware.

**Location:** `backend/src/__tests__/apiKeyMiddleware.test.js`

**Test Suites:**
- ✅ `validateApiKey`
  - Successful authentication
  - Authentication failures (missing/invalid credentials)
  - API key format validation
  - Security tests (timing-safe comparison)
  
- ✅ `logApiRequest`
  - Successful request logging
  - Error logging
  - Request tracking (response time, status codes)

**Key Security Tests:**
```javascript
it('should use timing-safe comparison for secrets', async () => {
  // Ensures bcrypt.compare is used (prevents timing attacks)
  expect(bcrypt.compare).toHaveBeenCalledWith(
    'secret_timing456',
    '$2a$10$hashedSecret'
  );
});
```

### Frontend Tests

#### 3. **LeadDetailCustomFields.test.jsx**
Tests custom fields display in lead detail page.

**Location:** `frontend/src/test/LeadDetailCustomFields.test.jsx`

**Test Suites:**
- ✅ `Custom Fields Rendering`
  - Displays custom fields section when fields exist
  - Hides section when no custom fields
  - Field count badge (singular/plural)
  
- ✅ `Field Name Formatting`
  - Converts snake_case to Title Case
  - Example: `company_size` → "Company Size"
  
- ✅ `Data Type Handling`
  - Booleans: `true` → "Yes", `false` → "No"
  - Numbers: Display as strings
  - Null/undefined: Display as "N/A"
  - Objects: JSON stringify
  
- ✅ `Real-World Scenarios`
  - Real estate lead fields
  - SaaS lead fields
  
- ✅ `Performance`
  - Handles 20+ custom fields efficiently (< 1 second render)

**Example Test:**
```javascript
it('should format snake_case field names to Title Case', async () => {
  const mockLead = {
    custom_fields: {
      company_size: '100',
      hear_about_us: 'Google',
      interested_in_product: 'Enterprise'
    }
  };
  
  // Expects to see: "Company Size", "Hear About Us", "Interested In Product"
});
```

#### 4. **APIClientsFieldMapping.test.jsx**
Tests field mapping UI in API client creation form.

**Location:** `frontend/src/test/APIClientsFieldMapping.test.jsx`

**Test Suites:**
- ✅ `Field Mapping UI Rendering`
  - Shows mapping section in create modal
  - Help text and examples
  - Add field mapping button
  
- ✅ `Adding Field Mappings`
  - Single mapping addition
  - Multiple mappings
  - Arrow indicator between fields
  
- ✅ `Removing Field Mappings`
  - Delete button functionality
  
- ✅ `Form Submission with Field Mapping`
  - Includes custom_field_mapping in API request
  - Multiple mappings in request
  - Empty object when no mappings
  - Ignores incomplete mappings (empty source or target)
  
- ✅ `Form Reset`
  - Clears mappings after successful submission
  
- ✅ `UI/UX Features`
  - Proper placeholder text
  - Optional field indicators
  - Section styling and layout

**Example Test:**
```javascript
it('should include multiple mappings in API request', async () => {
  // Add 3 field mappings
  // company_name → company
  // contact_phone → phone
  // budget_range → budget
  
  expect(api.post).toHaveBeenCalledWith(
    '/api-clients',
    expect.objectContaining({
      custom_field_mapping: {
        company_name: 'company',
        contact_phone: 'phone',
        budget_range: 'budget'
      }
    })
  );
});
```

## 🚀 Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test leadCaptureController.test.js

# Run specific test file (API middleware)
npm test apiKeyMiddleware.test.js

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm run test

# Run in watch mode (recommended for development)
npm run test:watch

# Run specific test file
npm run test LeadDetailCustomFields.test.jsx

# Run all field mapping tests
npm run test APIClientsFieldMapping.test.jsx

# Single run (for CI/CD)
npm run test:run

# Coverage report
npm run test:run -- --coverage
```

### Run All Tests (Both Backend & Frontend)

From project root:
```bash
# Backend tests
cd backend && npm test && cd ..

# Frontend tests
cd frontend && npm run test:run && cd ..
```

## 📊 Test Coverage

### Current Coverage

| Module | File | Coverage |
|--------|------|----------|
| Backend | leadCaptureController.js | 95%+ |
| Backend | apiKeyMiddleware.js | 90%+ |
| Frontend | LeadDetail.jsx (custom fields) | 85%+ |
| Frontend | APIClients.jsx (field mapping) | 80%+ |

### Coverage Goals

- ✅ Backend controllers: 90%+
- ✅ Backend middleware: 90%+
- ✅ Frontend components: 80%+
- 🎯 Integration tests: Complete critical paths

### Key Areas Covered

#### Backend
- [x] Single lead capture with custom fields
- [x] Bulk lead capture with custom fields
- [x] Custom field mapping application
- [x] API authentication (key + secret)
- [x] Request logging
- [x] Error handling
- [x] Security (timing-safe comparisons)

#### Frontend
- [x] Custom fields display (all data types)
- [x] Field name formatting
- [x] Field mapping UI (add/remove)
- [x] Form submission with mappings
- [x] Empty state handling
- [x] Performance with many fields

## 🧪 Manual Testing

### Manual Test Checklist

#### 1. API Client Creation with Field Mapping

1. ✅ Log into CRM dashboard
2. ✅ Navigate to API Clients page
3. ✅ Click "Create API Client"
4. ✅ Fill required fields:
   - Client Name: "Test Client"
   - Default Lead Source: "api"
5. ✅ Add field mapping:
   - Click "+ Add Field Mapping"
   - Source: `company_name`
   - Target: `company`
6. ✅ Click "Create API Client"
7. ✅ Verify API key and secret are shown
8. ✅ Save credentials

**Expected Result:** API client created with custom field mapping saved.

#### 2. Lead Capture with Custom Fields

Create test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Custom Fields Test</title>
</head>
<body>
    <h1>Test Form - Custom Fields</h1>
    <form id="leadForm">
        <input name="first_name" placeholder="First Name" required><br>
        <input name="last_name" placeholder="Last Name" required><br>
        <input name="email" placeholder="Email" type="email" required><br>
        <input name="company_name" placeholder="Company Name"><br>
        <input name="budget" placeholder="Budget"><br>
        <input name="timeline" placeholder="Timeline"><br>
        <button type="submit">Submit Lead</button>
    </form>
    
    <div id="result"></div>

    <script>
        document.getElementById('leadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const payload = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                email: formData.get('email'),
                custom_fields: {
                    company_name: formData.get('company_name'),
                    budget: formData.get('budget'),
                    timeline: formData.get('timeline')
                }
            };
            
            const response = await fetch('YOUR_API_URL/api/v1/capture/lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'YOUR_API_KEY',
                    'X-API-Secret': 'YOUR_API_SECRET'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            document.getElementById('result').innerHTML = 
                '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        });
    </script>
</body>
</html>
```

**Test Steps:**
1. ✅ Replace `YOUR_API_URL`, `YOUR_API_KEY`, `YOUR_API_SECRET`
2. ✅ Open HTML file in browser
3. ✅ Fill form:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@test.com"
   - Company Name: "Acme Corp"
   - Budget: "$50,000"
   - Timeline: "Q1 2024"
4. ✅ Submit form
5. ✅ Verify success response

**Expected Response:**
```json
{
  "success": true,
  "message": "Lead captured successfully",
  "data": {
    "lead_id": "uuid-here",
    "status": "new",
    "has_custom_fields": true
  }
}
```

#### 3. View Custom Fields in Dashboard

1. ✅ Log into CRM dashboard
2. ✅ Navigate to Leads page
3. ✅ Find the test lead (John Doe)
4. ✅ Click on lead to view details
5. ✅ Scroll down to "Custom Fields" section

**Expected Result:**
- Section header: "Custom Fields"
- Badge: "3 fields"
- Fields displayed:
  - **Company Name:** Acme Corp (or **Company:** Acme Corp if mapped)
  - **Budget:** $50,000
  - **Timeline:** Q1 2024

#### 4. Test Field Mapping

1. ✅ Use API client with mapping: `company_name → company`
2. ✅ Submit lead with `company_name: "Test Corp"`
3. ✅ View lead in dashboard
4. ✅ Verify custom field shows as **Company:** Test Corp

**Expected Result:** Field name transformed according to mapping.

#### 5. Test Various Data Types

Submit lead with different data types:

```json
{
  "first_name": "Data",
  "last_name": "Types",
  "email": "types@test.com",
  "custom_fields": {
    "newsletter": true,
    "urgent": false,
    "employee_count": 150,
    "budget_amount": 75000.50,
    "notes": "This is a text field",
    "empty_field": null
  }
}
```

**Expected Display in Dashboard:**
- **Newsletter:** Yes
- **Urgent:** No
- **Employee Count:** 150
- **Budget Amount:** 75000.5
- **Notes:** This is a text field
- **Empty Field:** N/A

#### 6. Performance Test (Many Fields)

Submit lead with 25 custom fields:

```bash
curl -X POST YOUR_API_URL/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -H "X-API-Secret: YOUR_SECRET" \
  -d '{
    "first_name": "Performance",
    "last_name": "Test",
    "email": "perf@test.com",
    "custom_fields": {
      "field_1": "value_1",
      "field_2": "value_2",
      ...
      "field_25": "value_25"
    }
  }'
```

**Expected Result:**
- ✅ API responds in < 500ms
- ✅ Dashboard loads lead details in < 1 second
- ✅ All 25 fields display correctly

## 🐛 Troubleshooting Tests

### Backend Tests Failing

**Issue:** Jest cannot find modules
```bash
# Solution: Install dependencies
cd backend
npm install
```

**Issue:** Supabase mock errors
```bash
# Solution: Ensure mock is set up before imports
# Check test file has mock at top
```

### Frontend Tests Failing

**Issue:** Vitest configuration errors
```bash
# Solution: Check vitest.config.js exists
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

**Issue:** Component rendering errors
```bash
# Solution: Ensure all mocks are in place
# Check vi.mock() calls are correct
```

### Integration Tests Failing

**Issue:** API authentication fails
```bash
# Solution: Verify .env has correct Supabase credentials
# Check api_clients table exists in database
```

**Issue:** Custom fields not saving
```bash
# Solution: Verify leads table has custom_fields JSONB column
# Run migration: migrations/20251028_lead_capture_api.sql
```

## 📈 Continuous Improvement

### Adding New Tests

When adding new custom field features:

1. **Write Backend Tests First**
   ```javascript
   // backend/src/__tests__/yourFeature.test.js
   describe('New Feature', () => {
     it('should handle new custom field type', async () => {
       // Test implementation
     });
   });
   ```

2. **Write Frontend Tests**
   ```javascript
   // frontend/src/test/yourFeature.test.jsx
   it('should display new field type correctly', async () => {
     // Test implementation
   });
   ```

3. **Update Manual Test Checklist**
   - Add manual test steps to this document

4. **Run All Tests**
   ```bash
   # Backend
   cd backend && npm test
   
   # Frontend
   cd frontend && npm run test:run
   ```

### Test Maintenance

- Review and update tests when API changes
- Keep manual test checklists current
- Update coverage targets as needed
- Document edge cases discovered in production

## 🎉 Success Criteria

All tests passing when:

- ✅ Backend: All Jest tests pass (100+ tests)
- ✅ Frontend: All Vitest tests pass (50+ tests)
- ✅ Manual: All manual test steps complete successfully
- ✅ Coverage: Backend >90%, Frontend >80%
- ✅ Security: All auth and security tests pass
- ✅ Performance: All performance benchmarks met

## 🔗 Related Documentation

- [Custom Fields Guide](./CUSTOM_FIELDS_GUIDE.md) - Client documentation
- [Custom Fields Implementation](./CUSTOM_FIELDS_IMPLEMENTATION_SUMMARY.md) - Technical details
- [Quick Test Guide](./CUSTOM_FIELDS_QUICK_TEST.md) - 5-minute test
- [Lead Capture API Guide](./lead-capture-api-integration-guide.md) - API reference

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0  
**Maintained By:** CRM Development Team

