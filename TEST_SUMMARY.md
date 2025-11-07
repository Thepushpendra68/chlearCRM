# Account Management Module - Test Suite

## 📋 **Test Coverage Summary**

This document outlines all the tests created to verify the Account Management module functionality.

---

## 🧪 **Backend Tests**

### **1. accountService.test.js**
**Location:** `backend/src/__tests__/accountService.test.js`

**Test Coverage:**
- ✅ `getAccounts` - Fetch accounts with pagination and filters
- ✅ `getAccountById` - Fetch account by ID
- ✅ `createAccount` - Create new account
- ✅ `updateAccount` - Update existing account
- ✅ `deleteAccount` - Delete account
- ✅ `getAccountLeads` - Fetch leads associated with account
- ✅ `getAccountStats` - Fetch account statistics
- ✅ `getAccountTimeline` - Fetch account timeline (activities, tasks, audit logs)
- ✅ Error handling for not found scenarios
- ✅ Parent account validation
- ✅ Company-based access control

**Run Tests:**
```bash
cd backend
npm test accountService.test.js
```

---

### **2. accountController.test.js**
**Location:** `backend/src/__tests__/accountController.test.js`

**Test Coverage:**
- ✅ `getAccounts` - Controller handles account list requests
- ✅ `getAccountById` - Controller handles single account requests
- ✅ `createAccount` - Controller handles account creation
- ✅ `updateAccount` - Controller handles account updates
- ✅ `deleteAccount` - Controller handles account deletion
- ✅ `getAccountLeads` - Controller handles account leads requests
- ✅ `getAccountStats` - Controller handles statistics requests
- ✅ `getAccountTimeline` - Controller handles timeline requests
- ✅ Validation error handling
- ✅ Error propagation to error handler

**Run Tests:**
```bash
cd backend
npm test accountController.test.js
```

---

### **3. accountValidators.test.js**
**Location:** `backend/src/__tests__/accountValidators.test.js`

**Test Coverage:**
- ✅ Name validation (required, max length)
- ✅ Email validation (format, empty string handling)
- ✅ Website validation (URL format, empty string handling)
- ✅ Status validation (active, inactive, archived)
- ✅ Parent account ID validation (UUID format)
- ✅ Assigned to validation (UUID format)
- ✅ Annual revenue validation (positive numbers)
- ✅ Employee count validation (non-negative integers)
- ✅ Address validation (object type)
- ✅ Custom fields validation (object type)
- ✅ Empty string handling for optional fields

**Run Tests:**
```bash
cd backend
npm test accountValidators.test.js
```

---

## 🎨 **Frontend Tests**

### **4. AccountForm.test.jsx**
**Location:** `frontend/src/test/AccountForm.test.jsx`

**Test Coverage:**
- ✅ Renders create account form
- ✅ Renders edit account form
- ✅ Validates required fields
- ✅ Creates account successfully
- ✅ Updates account successfully
- ✅ Handles form submission errors
- ✅ Closes form on cancel
- ✅ Validates email format
- ✅ Validates website URL format

**Run Tests:**
```bash
cd frontend
npm test AccountForm.test.jsx
```

---

### **5. AccountDetail.test.jsx**
**Location:** `frontend/src/test/AccountDetail.test.jsx`

**Test Coverage:**
- ✅ Renders account detail page
- ✅ Displays account information
- ✅ Displays account statistics
- ✅ Displays associated leads
- ✅ Displays activities list
- ✅ Displays tasks list
- ✅ Shows add activity button
- ✅ Shows add task button
- ✅ Displays timeline section
- ✅ Handles loading state
- ✅ Handles error state

**Run Tests:**
```bash
cd frontend
npm test AccountDetail.test.jsx
```

---

### **6. AccountTimeline.test.jsx**
**Location:** `frontend/src/test/AccountTimeline.test.jsx`

**Test Coverage:**
- ✅ Renders timeline with events
- ✅ Displays loading state
- ✅ Displays empty state
- ✅ Groups events by date
- ✅ Displays activity completion status
- ✅ Displays task status and priority
- ✅ Displays actor information for audit events
- ✅ Displays scheduled date for activities
- ✅ Displays due date for tasks

**Run Tests:**
```bash
cd frontend
npm test AccountTimeline.test.jsx
```

---

### **7. Accounts.test.jsx**
**Location:** `frontend/src/test/Accounts.test.jsx`

**Test Coverage:**
- ✅ Renders accounts list
- ✅ Displays add account button
- ✅ Opens account form when add button is clicked
- ✅ Filters accounts by status
- ✅ Searches accounts by name
- ✅ Handles pagination
- ✅ Displays account details in table
- ✅ Opens edit form when edit button is clicked
- ✅ Handles delete account
- ✅ Handles loading state
- ✅ Handles empty state

**Run Tests:**
```bash
cd frontend
npm test Accounts.test.jsx
```

---

### **8. LeadAccountIntegration.test.jsx**
**Location:** `frontend/src/test/LeadAccountIntegration.test.jsx`

**Test Coverage:**
- ✅ Displays account selector in lead form
- ✅ Loads accounts for selector
- ✅ Allows selecting an account when creating lead
- ✅ Allows selecting an account when editing lead
- ✅ Displays account information when lead has account
- ✅ Does not display account section when lead has no account

**Run Tests:**
```bash
cd frontend
npm test LeadAccountIntegration.test.jsx
```

---

### **9. ActivityFormAccount.test.jsx**
**Location:** `frontend/src/test/ActivityFormAccount.test.jsx`

**Test Coverage:**
- ✅ Displays account selector in activity form
- ✅ Allows creating activity with account_id
- ✅ Allows creating activity with lead_id
- ✅ Clears account when lead is selected
- ✅ Clears lead when account is selected
- ✅ Requires either lead or account to be selected
- ✅ Pre-fills account when accountId prop is provided

**Run Tests:**
```bash
cd frontend
npm test ActivityFormAccount.test.jsx
```

---

### **10. TaskFormAccount.test.jsx**
**Location:** `frontend/src/test/TaskFormAccount.test.jsx`

**Test Coverage:**
- ✅ Displays account selector in task form
- ✅ Allows creating task with account_id
- ✅ Allows creating task with lead_id
- ✅ Clears account when lead is selected
- ✅ Clears lead when account is selected
- ✅ Pre-fills account when accountId prop is provided
- ✅ Pre-fills lead when leadId prop is provided
- ✅ Allows editing task with account_id

**Run Tests:**
```bash
cd frontend
npm test TaskFormAccount.test.jsx
```

---

## 🚀 **Running All Tests**

### **Backend Tests:**
```bash
cd backend
npm test
```

### **Frontend Tests:**
```bash
cd frontend
npm test
```

### **Run Specific Test Files:**
```bash
# Backend
cd backend
npm test accountService.test.js
npm test accountController.test.js
npm test accountValidators.test.js

# Frontend
cd frontend
npm test AccountForm.test.jsx
npm test AccountDetail.test.jsx
npm test AccountTimeline.test.jsx
npm test Accounts.test.jsx
npm test LeadAccountIntegration.test.jsx
npm test ActivityFormAccount.test.jsx
npm test TaskFormAccount.test.jsx
```

### **Watch Mode (for development):**
```bash
# Backend
cd backend
npm run test:watch

# Frontend
cd frontend
npm test -- --watch
```

---

## 📊 **Test Statistics**

### **Backend Tests:**
- **Total Test Files:** 3
- **Total Test Cases:** ~30+
- **Coverage Areas:**
  - Service layer (CRUD operations)
  - Controller layer (request/response handling)
  - Validation layer (input validation)

### **Frontend Tests:**
- **Total Test Files:** 7
- **Total Test Cases:** ~40+
- **Coverage Areas:**
  - Component rendering
  - User interactions
  - Form validation
  - API integration
  - Error handling
  - Loading states

---

## ✅ **Test Checklist**

### **Backend:**
- [x] Account CRUD operations
- [x] Account filtering and pagination
- [x] Account hierarchy (parent-child)
- [x] Account-lead relationships
- [x] Account statistics
- [x] Account timeline
- [x] Input validation
- [x] Error handling
- [x] Role-based access control

### **Frontend:**
- [x] Account list page
- [x] Account detail page
- [x] Account form (create/edit)
- [x] Account timeline component
- [x] Lead-account integration
- [x] Activity-account integration
- [x] Task-account integration
- [x] Form validation
- [x] Error handling
- [x] Loading states

---

## 🎯 **Test Coverage Goals**

- ✅ **Unit Tests:** All service functions tested
- ✅ **Integration Tests:** Controller-service integration tested
- ✅ **Component Tests:** All React components tested
- ✅ **Validation Tests:** All input validators tested
- ✅ **Error Handling:** Error scenarios tested
- ✅ **Edge Cases:** Empty states, loading states tested

---

## 📝 **Notes**

1. **Mocking:** All tests use proper mocking for external dependencies (Supabase, API services)
2. **Isolation:** Each test is isolated and doesn't depend on other tests
3. **Coverage:** Tests cover both happy paths and error scenarios
4. **Maintainability:** Tests are well-structured and easy to maintain

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Tests failing due to missing mocks:**
   - Ensure all dependencies are properly mocked
   - Check that mock implementations return expected data structures

2. **Async test issues:**
   - Use `waitFor` for async operations
   - Ensure proper cleanup in `afterEach` hooks

3. **Environment variables:**
   - Backend tests set up environment variables at the top of test files
   - Frontend tests don't require environment variables (mocked)

---

**All tests are ready to run!** 🎉

