# Email Automation System - Testing Checklist

## Pre-Testing Setup ✅

### 1. Database Migration
- [ ] Run SQL migration: `migrations/20251031_email_templates_and_automation.sql`
- [ ] Verify all tables created:
  - [ ] integration_settings
  - [ ] email_templates
  - [ ] email_template_versions
  - [ ] outbound_messages
  - [ ] email_sequences
  - [ ] sequence_enrollments
  - [ ] automation_rules
  - [ ] email_suppression_list

### 2. Backend Dependencies
- [ ] Navigate to `backend/` directory
- [ ] Run `npm install`
- [ ] Verify all dependencies installed (postmark, mjml, handlebars, etc.)

### 3. Frontend Dependencies
- [ ] Navigate to `frontend/` directory
- [ ] Run `npm install`
- [ ] Verify all dependencies installed (Monaco, GrapesJS, React Flow)

### 4. Environment Variables (Backend)
- [ ] Create/update `backend/.env` with:
  ```env
  SUPABASE_URL=your_supabase_url
  SUPABASE_KEY=your_supabase_key
  JWT_SECRET=your_jwt_secret
  # Optional: Can be configured via UI
  POSTMARK_API_KEY=your_postmark_token (optional)
  ```

### 5. Postmark Setup (Optional for full testing)
- [ ] Sign up at postmarkapp.com
- [ ] Create a Server
- [ ] Get Server API Token
- [ ] Verify sender email/domain
- [ ] Configure webhook: `https://yourdomain.com/api/email/webhooks/postmark`
  - Events: Open, Click, Bounce, SpamComplaint

---

## Backend Testing 🔧

### 1. Server Startup
- [ ] Run `npm start` or `npm run dev` in `backend/`
- [ ] Server starts without errors
- [ ] Port 5000 (or configured port) is accessible
- [ ] Console shows: "Email sequence worker initialized"

### 2. Email Routes Registration
- [ ] Check console for route registration
- [ ] Verify `/api/email/*` routes are registered
- [ ] No errors about missing dependencies

### 3. Database Connection
- [ ] Backend connects to Supabase successfully
- [ ] No RLS policy errors in logs
- [ ] Can query email tables

---

## Frontend Testing 🎨

### 1. Frontend Startup
- [ ] Run `npm run dev` in `frontend/`
- [ ] Vite server starts without errors
- [ ] Port 3000 (or configured port) is accessible
- [ ] No compilation errors

### 2. Navigation Elements
- [ ] Login to CRM as company admin
- [ ] Verify sidebar shows:
  - [ ] "Email Templates" link
  - [ ] "Email Sequences" link
  - [ ] "Email Analytics" link
  - [ ] "Email Settings" link (admin only)
- [ ] All links are clickable

---

## Feature Testing 📋

### A. Email Settings Configuration

#### Test 1: Access Settings Page
- [ ] Navigate to `/app/email/settings`
- [ ] Page loads without errors
- [ ] Form displays correctly
- [ ] Provider dropdown shows "Postmark"

#### Test 2: Configure Email Provider
- [ ] Enter Postmark Server API Token
- [ ] Enter from email (e.g., noreply@yourdomain.com)
- [ ] Enter from name (e.g., "Your Company")
- [ ] Enter reply-to email
- [ ] Click "Save Settings"
- [ ] Success toast appears
- [ ] Settings are saved to database

#### Test 3: View Webhook URL
- [ ] Webhook URL section displays
- [ ] Copy button works
- [ ] URL format: `https://yourdomain.com/api/email/webhooks/postmark`

**Expected Result**: Email settings saved successfully, ready to send emails

---

### B. Email Template Management

#### Test 4: View Templates List
- [ ] Navigate to `/app/email/templates`
- [ ] Page loads without errors
- [ ] Shows "No templates found" if empty
- [ ] "New Template" button is visible

#### Test 5: Create Template (Code Mode - MJML)
- [ ] Click "New Template"
- [ ] Fill in:
  - Name: "Test Welcome Email"
  - Subject: "Welcome {{lead.name}}!"
  - Category: "welcome"
  - Folder: "Onboarding"
- [ ] Editor mode: "Code" (default)
- [ ] Monaco editor loads
- [ ] Default MJML template appears
- [ ] Edit MJML content:
  ```xml
  <mjml>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>Hello {{lead.name}},</mj-text>
          <mj-text>Welcome to {{company.name}}!</mj-text>
          <mj-button href="#">Get Started</mj-button>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  ```
- [ ] Click "Compile MJML" button
- [ ] Success toast: "MJML compiled successfully"
- [ ] Click "Preview" button
- [ ] Preview modal opens with rendered HTML
- [ ] Merge variables show placeholder data
- [ ] Click "Save & Publish"
- [ ] Redirected to templates list
- [ ] New template appears in list

#### Test 6: Create Template (Visual Mode - GrapesJS)
- [ ] Click "New Template"
- [ ] Fill in name: "Test Visual Email"
- [ ] Switch to "Visual" editor mode
- [ ] GrapesJS loads without errors
- [ ] Can drag and drop components
- [ ] Can add text blocks
- [ ] Can add images
- [ ] Can add buttons
- [ ] Click "Save & Publish"
- [ ] Template saved successfully

#### Test 7: Template List Features
- [ ] Search for templates by name
- [ ] Filter by folder dropdown
- [ ] Filter by status (Active/Inactive)
- [ ] Templates grouped by folder
- [ ] Each template card shows:
  - Template name
  - Subject
  - Category badge
  - Last updated date
  - Active/Inactive status icon

#### Test 8: Template Actions
- [ ] Click "Edit" on a template
- [ ] Template editor opens with existing content
- [ ] Click "Duplicate" on a template
- [ ] Template is duplicated with "(Copy)" suffix
- [ ] Click "Delete" on a template
- [ ] Confirmation dialog appears
- [ ] Template is deleted

#### Test 9: Template Versions
- [ ] Edit an existing template
- [ ] Make changes to content
- [ ] Click "Save Draft"
- [ ] New version created
- [ ] Click "Save & Publish"
- [ ] Version is published
- [ ] Template published_version_id updated

**Expected Result**: Full template management with MJML and visual editors working

---

### C. Send One-Off Emails

#### Test 10: Send Email from Lead Detail
- [ ] Navigate to any lead detail page
- [ ] "Send Email" button visible in header
- [ ] Click "Send Email"
- [ ] Modal opens

#### Test 11: Send Email Modal
- [ ] Modal shows lead name and email
- [ ] Template dropdown populated with published templates
- [ ] Select a template
- [ ] Template info displays (name, subject, description)
- [ ] "Available Lead Variables" section shows:
  - {{lead.name}} = Actual name
  - {{lead.email}} = Actual email
  - {{lead.company}} = Actual company
  - {{lead.phone}} = Actual phone
- [ ] Click "Preview" button
- [ ] Preview modal opens
- [ ] Email rendered with lead's actual data
- [ ] Merge variables substituted correctly
- [ ] Close preview modal

#### Test 12: Send Email (Requires Postmark)
- [ ] In send email modal, click "Send Email"
- [ ] If no email settings: Error toast "Email settings not configured"
- [ ] If settings configured:
  - [ ] Success toast "Email sent successfully!"
  - [ ] Modal closes
  - [ ] Page refreshes
  - [ ] New email activity appears in lead timeline
  - [ ] Activity type: "Email Sent"
  - [ ] Activity description includes subject

#### Test 13: Email Tracking (Requires Postmark + Webhook)
- [ ] Send an email to yourself
- [ ] Open the email
- [ ] Check lead timeline
- [ ] New activity: "Email Opened" appears (may take 1-2 minutes)
- [ ] Click a link in email
- [ ] New activity: "Email Clicked" appears

**Expected Result**: Emails can be sent from leads with proper merge variables

---

### D. Email Sequences (Automation)

#### Test 14: View Sequences List
- [ ] Navigate to `/app/email/sequences`
- [ ] Page loads without errors
- [ ] Shows "No sequences found" if empty
- [ ] "New Sequence" button visible

#### Test 15: Create Sequence - Simple 2-Step
- [ ] Click "New Sequence"
- [ ] Fill in:
  - Name: "Test Welcome Sequence"
  - Description: "2-step welcome sequence"
- [ ] Visual workflow builder loads
- [ ] Trigger node visible at top
- [ ] React Flow canvas renders

#### Test 16: Add Email Node
- [ ] Click "Send Email" in left toolbar
- [ ] Email node added to canvas
- [ ] Node auto-connected to trigger
- [ ] Click on email node
- [ ] Right sidebar opens "Edit Step"
- [ ] Select template from dropdown
- [ ] Template name updates in node

#### Test 17: Add Wait Node
- [ ] Click "Wait" in left toolbar
- [ ] Wait node added below email node
- [ ] Auto-connected to previous node
- [ ] Click on wait node
- [ ] Edit properties:
  - Days: 1
  - Hours: 0
- [ ] Node label updates: "Wait 1d 0h"

#### Test 18: Add Second Email Node
- [ ] Click "Send Email" again
- [ ] Second email node added
- [ ] Auto-connected to wait node
- [ ] Select different template
- [ ] Node updates

#### Test 19: Add Condition Node
- [ ] Click "Condition" in left toolbar
- [ ] Condition node added
- [ ] Click on condition node
- [ ] Edit properties:
  - Field: "Lead Status"
  - Operator: "equals"
  - Value: "new"
- [ ] Node label updates

#### Test 20: Node Management
- [ ] Drag nodes to rearrange
- [ ] Delete a node (via "Delete" button in sidebar)
- [ ] Node and connected edges removed
- [ ] Add node back
- [ ] Manually connect nodes by dragging edges

#### Test 21: Save Sequence
- [ ] Click "Save Sequence"
- [ ] Success toast appears
- [ ] Redirected to sequences list
- [ ] New sequence appears
- [ ] Status shows "Inactive"
- [ ] Step count correct (e.g., "3 steps")

#### Test 22: Activate Sequence
- [ ] Click "Play" icon on sequence card
- [ ] Status changes to "Active"
- [ ] Success toast: "Sequence activated"

#### Test 23: View Sequence Details
- [ ] Click "Edit" on a sequence
- [ ] Sequence builder loads
- [ ] All nodes render correctly
- [ ] Node properties preserved
- [ ] Edges connected properly

**Expected Result**: Visual workflow builder works, sequences can be created and saved

---

### E. Email Sequence Enrollment & Processing

#### Test 24: Manual Enrollment (Via API)
Since there's no UI button yet, test via API:
- [ ] Open browser console on lead detail page
- [ ] Get lead ID from URL
- [ ] Get sequence ID from sequences page URL
- [ ] Run in console:
  ```javascript
  fetch('/api/email/sequences/SEQUENCE_ID/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ lead_id: 'LEAD_ID' })
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Check response: success message
- [ ] Navigate to backend logs
- [ ] Check for enrollment created

#### Test 25: Sequence Worker Processing
- [ ] Wait 1-2 minutes (worker runs every minute)
- [ ] Check backend logs for:
  ```
  [EmailSequenceWorker] Processing X pending enrollments
  [EmailSequenceWorker] Processing enrollment: ...
  [EmailSequenceWorker] Sent email for enrollment: ...
  ```
- [ ] Check lead timeline
- [ ] First email from sequence appears as activity
- [ ] Check database `sequence_enrollments`:
  - [ ] `current_step` incremented
  - [ ] `next_action_at` updated (if wait step)
  - [ ] `status` = 'active' or 'completed'

#### Test 26: Wait Step Processing
- [ ] If sequence has wait step:
- [ ] Check `next_action_at` in database
- [ ] Wait until `next_action_at` time passes
- [ ] Worker processes next step
- [ ] Second email sent
- [ ] Lead timeline updated

#### Test 27: Condition Evaluation
- [ ] If sequence has condition:
- [ ] Check lead's field value (e.g., status)
- [ ] If condition matches:
  - [ ] Next email sent
- [ ] If condition doesn't match:
  - [ ] Sequence stops or branches

#### Test 28: Unenroll Lead (Via API)
- [ ] Get enrollment ID from database
- [ ] Run in console:
  ```javascript
  fetch('/api/email/enrollments/ENROLLMENT_ID/unenroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ reason: 'manual' })
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Check response: success
- [ ] Check database: `status` = 'unenrolled'
- [ ] Worker skips this enrollment

**Expected Result**: Sequences process automatically, emails sent at right times

---

### F. Email Analytics

#### Test 29: View Analytics Dashboard
- [ ] Navigate to `/app/email/analytics`
- [ ] Page loads without errors
- [ ] If no emails sent:
  - [ ] Shows "No emails sent yet" message
  - [ ] All stats show 0
- [ ] If emails sent:
  - [ ] Stats cards display numbers

#### Test 30: Analytics Metrics
- [ ] **Total Sent**: Shows count of all sent emails
- [ ] **Delivered**: Shows delivered count + delivery rate %
- [ ] **Opened**: Shows opened count + open rate %
- [ ] **Clicked**: Shows clicked count + click rate %

#### Test 31: Performance Rates
- [ ] "Performance Rates" card displays
- [ ] Open Rate progress bar (green)
- [ ] Click Rate progress bar (blue)
- [ ] Bounce Rate progress bar (red)
- [ ] Percentages match calculations

#### Test 32: Industry Benchmarks
- [ ] "Industry Benchmarks" card displays
- [ ] Avg. Open Rate: 20-25%
- [ ] Avg. Click Rate: 2-5%
- [ ] Your rates shown with color:
  - Green if above benchmark
  - Orange if below benchmark

#### Test 33: Recent Emails Table
- [ ] Table displays recent sent emails
- [ ] Columns:
  - Recipient (name + email)
  - Subject
  - Status (badge with color)
  - Sent timestamp
  - Opened timestamp (or "-")
  - Clicked timestamp (or "-")
- [ ] Opened/clicked show green/blue icons
- [ ] Timestamps formatted nicely

#### Test 34: Live Tracking Update
- [ ] Send a test email to yourself
- [ ] Initially: status = "sent", no open/click
- [ ] Open the email
- [ ] Wait 1-2 minutes
- [ ] Refresh analytics page
- [ ] Status = "delivered"
- [ ] Opened timestamp appears
- [ ] Click a link in email
- [ ] Refresh again
- [ ] Clicked timestamp appears

**Expected Result**: Analytics show accurate email performance metrics

---

### G. Integration & Webhooks

#### Test 35: Postmark Webhook Handler
- [ ] Configure webhook in Postmark dashboard
- [ ] Send a test email via CRM
- [ ] Open the email
- [ ] Check backend logs for:
  ```
  [Webhook] Postmark event received: Open
  [Webhook] Updated message: ...
  ```
- [ ] Check database `outbound_messages`:
  - [ ] `opened_at` timestamp set
  - [ ] `open_count` incremented

#### Test 36: Click Tracking
- [ ] Click a link in test email
- [ ] Check backend logs for:
  ```
  [Webhook] Postmark event received: Click
  ```
- [ ] Check database:
  - [ ] `clicked_at` timestamp set
  - [ ] `click_count` incremented

#### Test 37: Bounce Handling
- [ ] Send email to invalid address (e.g., bounce@simulator.amazonses.com)
- [ ] Check webhook logs for Bounce event
- [ ] Check database:
  - [ ] `status` = 'bounced'
  - [ ] `bounced_at` timestamp set
- [ ] Check `email_suppression_list`:
  - [ ] Email added automatically
  - [ ] Reason: 'bounce'

#### Test 38: Suppression List
- [ ] Try sending to bounced email again
- [ ] Should be blocked
- [ ] Error: "Email is in suppression list"

**Expected Result**: Webhooks update tracking data in real-time

---

### H. Error Handling & Edge Cases

#### Test 39: Missing Email Settings
- [ ] Don't configure Postmark
- [ ] Try sending email
- [ ] Error toast: "Email settings not configured"
- [ ] No email sent

#### Test 40: Invalid Template
- [ ] Create template with invalid MJML
- [ ] Try to compile
- [ ] Error message shows MJML errors
- [ ] Can't publish until fixed

#### Test 41: Lead Without Email
- [ ] Create/find lead with no email address
- [ ] Try to send email
- [ ] Modal shows: "This lead does not have an email address"
- [ ] Send button disabled

#### Test 42: Unpublished Template
- [ ] Create template, don't publish
- [ ] Try to select in send modal
- [ ] Template shows "(No published version)"
- [ ] Can't send

#### Test 43: Invalid Merge Variables
- [ ] Create template with typo: `{{lead.namee}}`
- [ ] Send email
- [ ] Merge variable shows as empty or original tag
- [ ] Email still sends

#### Test 44: Rate Limiting
- [ ] Send 100+ emails rapidly (via script)
- [ ] Should hit rate limit
- [ ] Error: "Too many requests"
- [ ] Retry logic kicks in

#### Test 45: Sequence with Deleted Template
- [ ] Create sequence with email node
- [ ] Delete the template used in node
- [ ] Run sequence worker
- [ ] Check logs: Error about missing template
- [ ] Enrollment skips that step or fails gracefully

**Expected Result**: Errors handled gracefully, user-friendly messages

---

### I. Multi-Tenancy & Security

#### Test 46: Company Isolation
- [ ] Login as User A from Company A
- [ ] Create templates
- [ ] Logout
- [ ] Login as User B from Company B
- [ ] Can't see Company A's templates
- [ ] Can only see own company's data

#### Test 47: Role-Based Access
- [ ] Login as sales_rep
- [ ] Can access:
  - [ ] Email Templates
  - [ ] Email Sequences
  - [ ] Email Analytics
  - [ ] Send Email
- [ ] Can't access:
  - [ ] Email Settings (admin only)
  - [ ] Should see "Unauthorized" or redirect

#### Test 48: RLS Policies
- [ ] Check Supabase logs
- [ ] All queries should use RLS policies
- [ ] No company_id bypass in logs
- [ ] JWT authentication required

**Expected Result**: Data properly isolated by company, roles enforced

---

### J. Performance & Optimization

#### Test 49: Template List Performance
- [ ] Create 50+ templates
- [ ] Navigate to templates page
- [ ] Page loads quickly (<2s)
- [ ] Search/filter is responsive
- [ ] No console errors

#### Test 50: Sequence Builder Performance
- [ ] Create sequence with 20+ nodes
- [ ] Canvas remains responsive
- [ ] Can drag nodes smoothly
- [ ] Zoom in/out works
- [ ] MiniMap displays correctly

#### Test 51: Analytics with Large Dataset
- [ ] Send 1000+ test emails (via script/API)
- [ ] Navigate to analytics page
- [ ] Calculations complete quickly
- [ ] Table shows recent 20 emails
- [ ] Pagination or limit works

**Expected Result**: System performs well with realistic data volumes

---

## Critical Issues Checklist 🚨

### Backend
- [ ] No uncaught exceptions in console
- [ ] All routes respond correctly
- [ ] Database queries succeed
- [ ] Email sending works with valid settings
- [ ] Worker doesn't crash
- [ ] Logs are clean (no errors)

### Frontend
- [ ] No React errors in console
- [ ] All pages load without errors
- [ ] Navigation works
- [ ] Forms submit successfully
- [ ] Modals open/close properly
- [ ] Data fetches correctly
- [ ] Toast notifications work

### Integration
- [ ] API calls return expected data
- [ ] Authentication works
- [ ] RLS policies enforced
- [ ] Webhooks receive events
- [ ] Email provider integration works

---

## Test Results Summary

### ✅ Passing Tests
- List successful tests here

### ❌ Failing Tests
- List failed tests here with details

### ⚠️ Known Issues
- List known issues or limitations

### 📝 Notes
- Any additional observations or recommendations

---

## Quick Test Commands

### Backend Test (Manual API)
```bash
# Test template creation
curl -X POST http://localhost:5000/api/email/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "subject": "Test Subject",
    "category": "general"
  }'

# Test email sending (replace IDs)
curl -X POST http://localhost:5000/api/email/send/lead \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "LEAD_ID",
    "template_version_id": "VERSION_ID"
  }'
```

### Database Queries
```sql
-- Check templates
SELECT * FROM email_templates ORDER BY created_at DESC LIMIT 10;

-- Check sent emails
SELECT * FROM outbound_messages ORDER BY sent_at DESC LIMIT 10;

-- Check sequences
SELECT * FROM email_sequences;

-- Check enrollments
SELECT * FROM sequence_enrollments WHERE status = 'active';

-- Check suppression list
SELECT * FROM email_suppression_list;
```

---

## Post-Testing

### If All Tests Pass ✅
1. System is production-ready
2. Document any configuration needed
3. Train users on features
4. Monitor for first week
5. Collect feedback

### If Tests Fail ❌
1. Document failing tests
2. Check error logs
3. Review code for issues
4. Fix and retest
5. Update documentation

---

**Testing Date**: _____________
**Tester**: _____________
**Environment**: Development / Staging / Production
**Overall Status**: ✅ Pass / ❌ Fail / ⚠️ Partial

