# 🧪 WhatsApp Integration - Test Guide

## Overview

This guide covers all tests for the WhatsApp integration, including unit tests, integration tests, and end-to-end tests.

---

## 📊 Test Coverage

### Backend Tests
- **Services Tests**: 3 test suites (80+ test cases)
- **Controllers Tests**: 2 test suites (50+ test cases)
- **Integration Tests**: End-to-end API flows

### Frontend Tests
- **Service Tests**: 1 test suite (20+ test cases)
- **Component Tests**: 2 test suites (30+ test cases)
- **Integration Tests**: User flows

---

## 🚀 Running Tests

### Backend Tests

#### Run All Tests
```bash
cd backend
npm test
```

#### Run Specific Test Suite
```bash
# WhatsApp Meta Service
npm test -- whatsappMetaService.test.js

# WhatsApp Send Service
npm test -- whatsappSendService.test.js

# WhatsApp Controller
npm test -- whatsappController.test.js

# Webhook Controller
npm test -- whatsappWebhookController.test.js
```

#### Run with Coverage
```bash
npm test -- --coverage
```

#### Watch Mode
```bash
npm test -- --watch
```

### Frontend Tests

#### Run All Tests
```bash
cd frontend
npm run test
```

#### Run Specific Test Suite
```bash
# WhatsApp Service
npm run test -- whatsappService.test.js

# WhatsApp Message Component
npm run test -- WhatsAppMessage.test.jsx

# Send WhatsApp Modal
npm run test -- SendWhatsAppModal.test.jsx
```

#### Run with UI
```bash
npm run test:ui
```

#### Run in CI Mode
```bash
npm run test:run
```

---

## 📝 Test Suites

### 1. WhatsApp Meta Service Tests (`whatsappMetaService.test.js`)

**Tests:**
- ✅ Send text message successfully
- ✅ Send template message with parameters
- ✅ Verify webhook signature
- ✅ Fetch templates from Meta API
- ✅ Send media messages (image, video, document)
- ✅ Handle API errors gracefully
- ✅ Validate input parameters
- ✅ Handle rate limiting

**Coverage:**
- ✅ All public methods
- ✅ Error handling
- ✅ Input validation
- ✅ API interactions

### 2. WhatsApp Send Service Tests (`whatsappSendService.test.js`)

**Tests:**
- ✅ Send message and log to database
- ✅ Create activity records
- ✅ Update conversation tracking
- ✅ Handle Meta API errors
- ✅ Update message status (sent/delivered/read/failed)
- ✅ Create conversations for new contacts
- ✅ Link messages to leads/contacts
- ✅ Handle template message sending

**Coverage:**
- ✅ Database operations
- ✅ Activity logging
- ✅ Conversation management
- ✅ Status tracking
- ✅ Error scenarios

### 3. WhatsApp Controller Tests (`whatsappController.test.js`)

**Tests:**
- ✅ POST /api/whatsapp/send/text endpoint
- ✅ POST /api/whatsapp/send/template endpoint
- ✅ GET /api/whatsapp/messages endpoint
- ✅ GET /api/whatsapp/messages/:lead_id endpoint
- ✅ POST /api/whatsapp/templates/sync endpoint
- ✅ GET /api/whatsapp/templates endpoint
- ✅ GET /api/whatsapp/settings endpoint
- ✅ PUT /api/whatsapp/settings endpoint
- ✅ Request validation
- ✅ Error responses

**Coverage:**
- ✅ All API endpoints
- ✅ Request validation
- ✅ Error handling
- ✅ Response formatting

### 4. WhatsApp Webhook Controller Tests (`whatsappWebhookController.test.js`)

**Tests:**
- ✅ GET webhook verification with correct token
- ✅ GET webhook verification with incorrect token
- ✅ POST incoming message webhook
- ✅ POST message status update webhook
- ✅ Signature verification
- ✅ Multiple messages in one webhook
- ✅ Error handling during processing

**Coverage:**
- ✅ Webhook verification
- ✅ Event processing
- ✅ Signature validation
- ✅ Error scenarios

### 5. Frontend WhatsApp Service Tests (`whatsappService.test.js`)

**Tests:**
- ✅ sendTextMessage API call
- ✅ sendTemplateMessage API call
- ✅ getMessages with filters
- ✅ getConversations
- ✅ syncTemplates
- ✅ getTemplates
- ✅ formatPhoneNumber utility
- ✅ formatPhoneDisplay utility
- ✅ isValidWhatsAppNumber validation
- ✅ Error handling

**Coverage:**
- ✅ All service methods
- ✅ API interactions
- ✅ Utility functions
- ✅ Error scenarios

### 6. WhatsApp Message Component Tests (`WhatsAppMessage.test.jsx`)

**Tests:**
- ✅ Render outbound text message
- ✅ Render inbound text message
- ✅ Display status icons (sent/delivered/read)
- ✅ Show failed status with error
- ✅ Render template messages
- ✅ Render media messages (image/video/document)
- ✅ Apply correct styling for own/other messages
- ✅ Format timestamps
- ✅ Show message bubbles

**Coverage:**
- ✅ Message rendering
- ✅ Status indicators
- ✅ Media handling
- ✅ Styling
- ✅ Timestamp formatting

### 7. Send WhatsApp Modal Tests (`SendWhatsAppModal.test.jsx`)

**Tests:**
- ✅ Modal visibility (open/closed)
- ✅ Display recipient information
- ✅ Warning for missing phone number
- ✅ Send message successfully
- ✅ Handle send errors
- ✅ Enable/disable send button
- ✅ Keyboard shortcuts (Ctrl+Enter)
- ✅ Close modal actions
- ✅ Loading states
- ✅ Work with leads and contacts

**Coverage:**
- ✅ User interactions
- ✅ Form validation
- ✅ Message sending
- ✅ Error handling
- ✅ UI states

---

## 🔬 Integration Tests

### Manual Integration Testing Checklist

#### 1. Send Message Flow
```bash
# Test sending a message
curl -X POST http://localhost:5000/api/whatsapp/send/text \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Test message",
    "lead_id": "lead-uuid"
  }'
```

**Expected:**
- ✅ Response with `success: true`
- ✅ Message ID returned
- ✅ Message saved in `whatsapp_messages` table
- ✅ Activity logged in `activities` table
- ✅ Conversation created/updated in `whatsapp_conversations` table

#### 2. Receive Message Flow
```bash
# Send a WhatsApp message from your phone to the business number
# Expected webhook to be called automatically
```

**Expected:**
- ✅ Webhook receives POST request
- ✅ Message saved in database
- ✅ Lead created/updated
- ✅ Activity logged
- ✅ Conversation updated

#### 3. Template Message Flow
```bash
curl -X POST http://localhost:5000/api/whatsapp/send/template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "template_name": "welcome",
    "language": "en",
    "parameters": ["John"]
  }'
```

**Expected:**
- ✅ Template message sent
- ✅ Parameters interpolated correctly
- ✅ Message logged with template info

#### 4. Message Status Update Flow
```bash
# This is automatic when Meta sends status updates
# Check database after sending a message
```

**Expected:**
- ✅ Status updates from 'sent' → 'delivered' → 'read'
- ✅ Timestamps updated correctly
- ✅ Failed status handled with error message

---

## 🎯 End-to-End Tests

### E2E Test Scenarios

#### Scenario 1: Complete Message Journey
1. User opens lead detail page
2. Clicks "Send WhatsApp" button
3. Modal opens with lead info
4. Types message
5. Clicks "Send Message"
6. Message sent successfully
7. Toast notification appears
8. Modal closes
9. Activity appears in timeline
10. Badge count updates

**Test Command:**
```bash
cd frontend
npm run test:e2e -- --spec "whatsapp-send.spec.js"
```

#### Scenario 2: Inbox Conversation
1. User navigates to /app/whatsapp
2. Conversation list loads
3. User clicks on a conversation
4. Chat interface opens
5. Message history displays
6. User types and sends message
7. Message appears in chat
8. Conversation list updates

**Test Command:**
```bash
npm run test:e2e -- --spec "whatsapp-inbox.spec.js"
```

#### Scenario 3: Incoming Message Handling
1. Customer sends WhatsApp message
2. Webhook receives event
3. Message saved to database
4. Lead created/updated
5. Activity logged
6. Badge count increments
7. Message appears in inbox

**Verification:**
```sql
-- Check message saved
SELECT * FROM whatsapp_messages 
WHERE whatsapp_id = '919876543210' 
ORDER BY created_at DESC LIMIT 1;

-- Check activity logged
SELECT * FROM activities 
WHERE activity_type = 'whatsapp' 
ORDER BY created_at DESC LIMIT 1;

-- Check conversation
SELECT * FROM whatsapp_conversations 
WHERE whatsapp_id = '919876543210';
```

---

## 📈 Test Metrics & Goals

### Coverage Goals
- **Backend**: > 80% code coverage
- **Frontend**: > 70% code coverage
- **Critical Paths**: 100% coverage

### Performance Goals
- **Unit Tests**: < 5s total execution
- **Integration Tests**: < 30s total execution
- **E2E Tests**: < 2min total execution

### Quality Metrics
- **Test Pass Rate**: 100%
- **Flaky Tests**: 0
- **Skipped Tests**: 0

---

## 🐛 Debugging Failed Tests

### Common Issues

#### Issue: "Cannot find module"
**Solution:**
```bash
# Reinstall dependencies
npm install

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "Timeout exceeded"
**Solution:**
```javascript
// Increase timeout in test
it('should handle slow operation', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

#### Issue: "Database connection failed"
**Solution:**
```bash
# Check environment variables
cat .env | grep SUPABASE

# Test connection
node -e "const {createClient} = require('@supabase/supabase-js'); const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); client.from('leads').select('count').then(r => console.log('Connected:', r))"
```

#### Issue: "Mock not working"
**Solution:**
```javascript
// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  vi.clearAllMocks();
});
```

---

## 🔄 Continuous Integration

### GitHub Actions (Example)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
      - uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm install
      - run: cd frontend && npm run test:run
```

---

## 📋 Test Checklist

Before merging/deploying, ensure:

### Unit Tests
- [ ] All backend service tests pass
- [ ] All backend controller tests pass
- [ ] All frontend service tests pass
- [ ] All frontend component tests pass

### Integration Tests
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] Webhooks process events
- [ ] Activities are logged

### E2E Tests
- [ ] Send message flow works
- [ ] Inbox displays correctly
- [ ] Badge counts update
- [ ] Modal functions properly

### Manual Tests
- [ ] Test on staging environment
- [ ] Test with real Meta API
- [ ] Test webhook with real events
- [ ] Test on mobile devices
- [ ] Test with different user roles

---

## 🎓 Writing New Tests

### Backend Test Template
```javascript
describe('YourService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await yourService.doSomething(input);
    
    // Assert
    expect(result.success).toBe(true);
  });
});
```

### Frontend Test Template
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)

---

## ✅ Quick Test Commands

```bash
# Backend - Run all tests
cd backend && npm test

# Backend - Run with coverage
cd backend && npm test -- --coverage

# Backend - Watch mode
cd backend && npm test -- --watch

# Frontend - Run all tests
cd frontend && npm run test

# Frontend - Run specific file
cd frontend && npm run test -- WhatsAppMessage

# Frontend - Watch mode
cd frontend && npm run test

# Frontend - Coverage
cd frontend && npm run test -- --coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

---

## 🎉 Test Success Criteria

All tests passing means:
- ✅ All API endpoints work correctly
- ✅ Messages send successfully
- ✅ Webhooks process events
- ✅ UI components render properly
- ✅ User flows complete successfully
- ✅ Error handling works
- ✅ Edge cases covered

**Your WhatsApp integration is production-ready!** 🚀

