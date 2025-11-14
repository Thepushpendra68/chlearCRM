# 🚀 Quick Test Execution Guide

## Prerequisites

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## ⚡ Quick Commands

### Run All Tests (Backend + Frontend)
```bash
# From project root
npm run test:all
```

### Backend Tests Only
```bash
cd backend
npm test
```

### Frontend Tests Only
```bash
cd frontend
npm run test
```

---

## 🎯 Specific Test Suites

### Backend

#### WhatsApp Services
```bash
cd backend
npm run test:whatsapp
```

#### Individual Files
```bash
# Meta Service
npm test -- whatsappMetaService.test.js

# Send Service
npm test -- whatsappSendService.test.js

# Controller
npm test -- whatsappController.test.js

# Webhook
npm test -- whatsappWebhookController.test.js
```

### Frontend

#### WhatsApp Components
```bash
cd frontend

# All WhatsApp tests
npm run test -- WhatsApp

# Specific component
npm run test -- WhatsAppMessage
npm run test -- SendWhatsAppModal

# Service
npm run test -- whatsappService
```

---

## 📊 Coverage Reports

### Backend Coverage
```bash
cd backend
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html  # Windows
xdg-open coverage/lcov-report/index.html  # Linux
```

### Frontend Coverage
```bash
cd frontend
npm run test -- --coverage

# Open coverage report
open coverage/index.html
```

---

## 🔄 Watch Mode (Development)

### Backend Watch
```bash
cd backend
npm run test:watch
```

### Frontend Watch
```bash
cd frontend
npm run test
# (Vitest runs in watch mode by default)
```

---

## ✅ Expected Results

### All Tests Should Pass

**Backend:**
```
Test Suites: 4 passed, 4 total
Tests:       80+ passed, 80+ total
Snapshots:   0 total
Time:        5-10s
```

**Frontend:**
```
Test Files  3 passed (3)
Tests  50+ passed (50+)
Duration  2-5s
```

---

## 🐛 If Tests Fail

### 1. Check Environment Variables
```bash
# Backend
cat backend/.env | grep -E "(SUPABASE|META_WHATSAPP)"

# Should see:
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
# META_WHATSAPP_ACCESS_TOKEN=...
# META_WHATSAPP_PHONE_NUMBER_ID=...
# META_WHATSAPP_APP_SECRET=...
# META_WHATSAPP_VERIFY_TOKEN=...
```

### 2. Clear Cache & Reinstall
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 3. Check Node Version
```bash
node --version
# Should be >= 18.0.0
```

### 4. Run Single Test for Debugging
```bash
# Backend
cd backend
npm test -- whatsappMetaService.test.js --verbose

# Frontend
cd frontend
npm run test -- WhatsAppMessage --reporter=verbose
```

---

## 📝 Test Output Examples

### Successful Backend Test
```
 PASS  src/services/__tests__/whatsappMetaService.test.js
  WhatsApp Meta Service
    sendTextMessage
      ✓ should send a text message successfully (25ms)
      ✓ should handle API errors (15ms)
      ✓ should validate phone number (5ms)
      ✓ should validate message content (5ms)
    sendTemplateMessage
      ✓ should send a template message successfully (20ms)
      ✓ should handle template with parameters (18ms)
    verifyWebhookSignature
      ✓ should verify valid signature (3ms)
      ✓ should reject invalid signature (2ms)
    ...
```

### Successful Frontend Test
```
✓ src/components/WhatsApp/__tests__/WhatsAppMessage.test.jsx (8)
  WhatsAppMessage
    ✓ should render outbound text message
    ✓ should render inbound text message
    ✓ should show sent status icon for outbound messages
    ✓ should show delivered status icon
    ✓ should show read status icon with blue color
    ✓ should show failed status with error message
    ✓ should render template message
    ✓ should render image message
```

---

## 🎯 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: cd backend && npm install
      
      - name: Run Backend Tests
        run: cd backend && npm run test:ci
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Install Frontend Dependencies
        run: cd frontend && npm install
      
      - name: Run Frontend Tests
        run: cd frontend && npm run test:run
```

---

## 📈 Performance Benchmarks

| Test Suite | Expected Time | Max Acceptable |
|------------|---------------|----------------|
| Backend Unit | 5-10s | 15s |
| Backend Integration | 10-20s | 30s |
| Frontend Unit | 2-5s | 10s |
| Frontend Integration | 5-10s | 15s |
| E2E Tests | 1-2min | 5min |

---

## ✨ Quick Verification

### Verify Everything Works
```bash
# From project root
./verify-tests.sh
```

**Or manually:**
```bash
# 1. Backend tests
cd backend && npm test && cd ..

# 2. Frontend tests
cd frontend && npm run test:run && cd ..

# 3. Check coverage
echo "✅ All tests passed!"
```

---

## 📞 Need Help?

If tests are failing:
1. Check `TEST_GUIDE.md` for detailed troubleshooting
2. Review error messages carefully
3. Ensure all dependencies installed
4. Check environment variables
5. Verify database connection

---

## 🎉 Success!

When all tests pass, you'll see:
```
✅ Backend: 80+ tests passed
✅ Frontend: 50+ tests passed
✅ Coverage: > 70%
✅ Integration: All flows working
✅ E2E: User journeys complete

🚀 WhatsApp integration is production-ready!
```

