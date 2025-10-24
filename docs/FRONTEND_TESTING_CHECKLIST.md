# Frontend Testing Checklist - Super Admin Platform

## Pre-Testing Setup

**Before you begin:**
- [ ] Backend server is running on `http://localhost:5000`
- [ ] Frontend is running on `http://localhost:3000`
- [ ] You have super admin credentials ready
- [ ] You have non-super admin credentials ready (for authorization testing)
- [ ] Browser developer tools are open (F12)

---

## 1. Authentication & Access (15 minutes)

### Login as Super Admin
- [ ] Open `http://localhost:3000`
- [ ] Navigate to login page
- [ ] Enter super admin credentials
- [ ] Click "Login"
- [ ] **Verify**: Successful login and redirect to dashboard

### Platform Link Visibility
- [ ] Look at sidebar navigation
- [ ] **Verify**: "Platform Admin" link is visible at bottom of sidebar
- [ ] **Verify**: Link has appropriate icon (CommandLineIcon or similar)
- [ ] **Verify**: Link has visual separator from other menu items

### Access Platform Dashboard
- [ ] Click "Platform Admin" link in sidebar
- [ ] **Verify**: Redirected to `/platform`
- [ ] **Verify**: Platform layout renders (header + sidebar + content)
- [ ] **Verify**: URL shows `/platform` in address bar
- [ ] **Verify**: No console errors in developer tools

---

## 2. Platform Dashboard Testing (20 minutes)

### Header Component
- [ ] **Verify**: "Platform Admin" title displays
- [ ] **Verify**: "Sakha CRM" subtitle displays
- [ ] **Verify**: Rocket emoji (🚀) icon displays
- [ ] **Verify**: "Back to App" button visible
- [ ] **Verify**: User name displays in top right
- [ ] **Verify**: User email displays in top right

### Click "Back to App"
- [ ] Click "Back to App" button
- [ ] **Verify**: Redirected to `/app/dashboard`
- [ ] Click "Platform Admin" again to return

### Statistics Cards
- [ ] **Verify**: "Total Companies" card displays
  - [ ] Shows number (not "undefined" or "null")
  - [ ] Has blue background icon
  - [ ] Has BuildingOfficeIcon
- [ ] **Verify**: "Active Users" card displays
  - [ ] Shows number
  - [ ] Has green background icon
  - [ ] Has UsersIcon
- [ ] **Verify**: "Total Leads" card displays
  - [ ] Shows number
  - [ ] Has purple background icon
  - [ ] Has DocumentTextIcon
- [ ] **Verify**: "Active (30d)" card displays
  - [ ] Shows number
  - [ ] Has orange background icon
  - [ ] Has ChartBarIcon

### Growth Metrics
- [ ] **Verify**: "New Companies (30d)" displays with number
- [ ] **Verify**: "New Users (30d)" displays with number
- [ ] **Verify**: "Leads Created (30d)" displays with number

### Recent Activity Feed
- [ ] **Verify**: "Recent Activity" section displays
- [ ] **Verify**: Activity items show (or "No recent activity" if empty)
- [ ] If activities exist:
  - [ ] Resource name displays
  - [ ] Activity type displays (e.g., "company created")
  - [ ] Timestamp displays in readable format

### Responsive Design (Optional)
- [ ] Resize browser to tablet width (768px)
- [ ] **Verify**: Layout adapts (cards stack vertically)
- [ ] Resize to mobile width (375px)
- [ ] **Verify**: Sidebar collapses or adapts
- [ ] Return to desktop width

---

## 3. Platform Sidebar Navigation (10 minutes)

### Navigation Links
Test each link in platform sidebar:

- [ ] Click "Overview"
  - [ ] **Verify**: Stays on `/platform`
  - [ ] **Verify**: "Overview" is highlighted/active

- [ ] Click "Companies"
  - [ ] **Verify**: Navigates to `/platform/companies`
  - [ ] **Verify**: "Companies" is highlighted/active

- [ ] Click "Audit Logs"
  - [ ] **Verify**: Navigates to `/platform/audit-logs`
  - [ ] **Verify**: "Audit Logs" is highlighted/active

- [ ] Click "Overview" again to return to dashboard

### Visual States
- [ ] **Verify**: Active link has different background (purple/indigo)
- [ ] **Verify**: Active link text is different color
- [ ] **Verify**: Hover states work on inactive links
- [ ] **Verify**: Icons align properly with text

---

## 4. Companies Page Testing (25 minutes)

### Navigate to Companies
- [ ] Click "Companies" in platform sidebar
- [ ] **Verify**: URL is `/platform/companies`
- [ ] **Verify**: Page title "Companies" displays
- [ ] **Verify**: Subtitle "Manage all companies on the platform" displays

### Companies Table
- [ ] **Verify**: Table loads successfully
- [ ] **Verify**: Table headers display:
  - [ ] Company
  - [ ] Status
  - [ ] Users
  - [ ] Leads
  - [ ] Created
  - [ ] Actions
- [ ] **Verify**: At least one company row displays (or "No companies found")

### Company Data Display
If companies exist, verify first company row:
- [ ] **Verify**: Company name displays
- [ ] **Verify**: Company slug displays (smaller text below name)
- [ ] **Verify**: Status badge displays with correct color:
  - [ ] "active" → green badge
  - [ ] "trial" → blue badge
  - [ ] "suspended" → red badge
  - [ ] "cancelled" → gray badge
- [ ] **Verify**: User count displays (e.g., "5 / 10" = 5 active / 10 total)
- [ ] **Verify**: Lead count displays
- [ ] **Verify**: Created date displays in readable format
- [ ] **Verify**: "View" button visible and styled correctly

### Search Functionality
- [ ] Type partial company name in search box
- [ ] Click "Search" button
- [ ] **Verify**: Results filter to matching companies
- [ ] **Verify**: Non-matching companies disappear
- [ ] Clear search box
- [ ] Click "Search"
- [ ] **Verify**: All companies return

### Status Filter
- [ ] Click status dropdown
- [ ] Select "Active"
- [ ] **Verify**: Only active companies display
- [ ] Select "Trial"
- [ ] **Verify**: Only trial companies display
- [ ] Select "All Status"
- [ ] **Verify**: All companies return

### Pagination (if applicable)
If you have more than 20 companies:
- [ ] **Verify**: Pagination controls display at bottom
- [ ] **Verify**: Shows "Showing page X of Y"
- [ ] Click "Next" button
- [ ] **Verify**: Page increments, new companies load
- [ ] Click "Previous" button
- [ ] **Verify**: Page decrements, previous companies load
- [ ] **Verify**: Buttons disable at first/last page

### View Company Details
- [ ] Click "View" button on first company
- [ ] **Verify**: Navigates to `/platform/companies/{id}`

---

## 5. Company Details Page Testing (25 minutes)

### Page Header
- [ ] **Verify**: Company name displays as page title
- [ ] **Verify**: Company slug displays below name
- [ ] **Verify**: "Back" arrow button visible
- [ ] **Verify**: Status dropdown displays current status

### Statistics Cards
- [ ] **Verify**: "Total Users" card displays with number
- [ ] **Verify**: "Total Leads" card displays with number
- [ ] **Verify**: "Activities (30d)" card displays with number

### Users List
- [ ] **Verify**: "Users" section displays
- [ ] **Verify**: At least one user displays (or empty state)
- [ ] For each user:
  - [ ] **Verify**: User avatar/icon displays
  - [ ] **Verify**: Full name displays
  - [ ] **Verify**: Role displays (formatted, e.g., "Company Admin")
  - [ ] **Verify**: "Impersonate" button visible

### Status Update
- [ ] Note current status
- [ ] Click status dropdown
- [ ] Select different status (e.g., "Trial" if currently "Active")
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: Status updates in dropdown
- [ ] **Verify**: Page doesn't reload (AJAX update)
- [ ] Change status back to original
- [ ] **Verify**: Success toast appears again

### Back Navigation
- [ ] Click back arrow button
- [ ] **Verify**: Returns to `/platform/companies`
- [ ] **Verify**: Company list still displays

---

## 6. Impersonation Testing (20 minutes)

### Start Impersonation
- [ ] Go to `/platform/companies`
- [ ] Click "View" on a company
- [ ] Click "Impersonate" on a user
- [ ] **Verify**: Redirect to `/app/dashboard`
- [ ] **Verify**: Page loads successfully

### Impersonation Banner
- [ ] **Verify**: Amber/orange banner displays at top of page
- [ ] **Verify**: Warning icon displays
- [ ] **Verify**: "Impersonation Mode Active" title shows
- [ ] **Verify**: Impersonated user's name displays
- [ ] **Verify**: Impersonated user's email displays
- [ ] **Verify**: "End Impersonation" button visible

### User Context Switch
- [ ] Open browser console (F12)
- [ ] Check localStorage:
  ```javascript
  localStorage.getItem('user')
  ```
- [ ] **Verify**: User context shows impersonated user's data
- [ ] Navigate around app (Leads, Dashboard, etc.)
- [ ] **Verify**: Data reflects impersonated user's company/role
- [ ] **Verify**: Permissions reflect impersonated user's role

### End Impersonation
- [ ] Click "End Impersonation" button in banner
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: Banner disappears
- [ ] **Verify**: Page reloads or context switches back
- [ ] Check localStorage again:
  ```javascript
  localStorage.getItem('user')
  ```
- [ ] **Verify**: User context shows super admin again
- [ ] **Verify**: Can access Platform Admin again

### Impersonation Audit Trail
- [ ] Go to `/platform/audit-logs`
- [ ] Look for recent entries
- [ ] **Verify**: "impersonate_user" action logged
- [ ] **Verify**: "end_impersonation" action logged
- [ ] **Verify**: Actor shows super admin email
- [ ] **Verify**: Details show impersonated user info

---

## 7. Audit Logs Page Testing (20 minutes)

### Navigate to Audit Logs
- [ ] Click "Audit Logs" in platform sidebar
- [ ] **Verify**: URL is `/platform/audit-logs`
- [ ] **Verify**: Page title "Audit Logs" displays
- [ ] **Verify**: Subtitle about activity/security logs displays

### Audit Logs Table
- [ ] **Verify**: Table displays with columns:
  - [ ] Timestamp
  - [ ] Actor (email + role)
  - [ ] Action
  - [ ] Resource
  - [ ] Severity
- [ ] **Verify**: At least one audit log displays
- [ ] **Verify**: Logs ordered by timestamp (newest first)

### Log Entry Display
For first audit log:
- [ ] **Verify**: Timestamp in readable format (e.g., "12/15/2024, 3:45:30 PM")
- [ ] **Verify**: Actor email displays
- [ ] **Verify**: Actor role displays below email (formatted)
- [ ] **Verify**: Action displays (formatted, e.g., "view platform stats")
- [ ] **Verify**: Resource type displays
- [ ] **Verify**: Severity badge displays with correct color:
  - [ ] "info" → blue badge
  - [ ] "warning" → yellow badge
  - [ ] "critical" → red badge

### Severity Filter
- [ ] Click severity dropdown
- [ ] Select "Warning"
- [ ] **Verify**: Only warning-severity logs display
- [ ] Select "Info"
- [ ] **Verify**: Only info-severity logs display
- [ ] Select "All Severity"
- [ ] **Verify**: All logs return

### Action Filter
- [ ] Type "view" in action filter input
- [ ] **Verify**: Results filter to actions containing "view"
- [ ] Type "impersonate"
- [ ] **Verify**: Results filter to impersonation actions
- [ ] Clear filter
- [ ] **Verify**: All logs return

### Pagination (if >50 logs)
- [ ] **Verify**: Pagination controls display
- [ ] Click "Next" page
- [ ] **Verify**: Next set of logs loads
- [ ] Click "Previous"
- [ ] **Verify**: Previous logs return

---

## 8. Authorization Testing (15 minutes)

### Non-Super Admin Access
- [ ] Logout from super admin account
- [ ] Login as company admin OR manager OR sales rep
- [ ] **Verify**: Successfully logged in
- [ ] **Verify**: "Platform Admin" link does NOT appear in sidebar
- [ ] In browser, manually navigate to `http://localhost:3000/platform`
- [ ] **Verify**: Immediately redirected to `/app/dashboard`
- [ ] Try `http://localhost:3000/platform/companies`
- [ ] **Verify**: Redirected to `/app/dashboard` again

### Route Protection
- [ ] Still logged in as non-super admin
- [ ] Open developer tools → Network tab
- [ ] Try to access `/platform` again
- [ ] **Verify**: No API calls to `/api/platform/*` endpoints
- [ ] **Verify**: Route guard blocks access before API calls

### Return to Super Admin
- [ ] Logout from non-super admin
- [ ] Login as super admin
- [ ] **Verify**: "Platform Admin" link appears again
- [ ] Click "Platform Admin"
- [ ] **Verify**: Can access platform successfully

---

## 9. Error Handling & Edge Cases (15 minutes)

### Empty States
- [ ] If no companies exist (test in staging):
  - [ ] **Verify**: "No companies found" message displays
  - [ ] **Verify**: No table errors

- [ ] If no audit logs exist:
  - [ ] **Verify**: "No audit logs found" message displays
  - [ ] **Verify**: Table headers still display

### Network Errors
- [ ] Stop backend server (Ctrl+C in backend terminal)
- [ ] Try to load platform dashboard
- [ ] **Verify**: Error toast appears
- [ ] **Verify**: Loading state displays
- [ ] **Verify**: No unhandled errors in console
- [ ] Restart backend server
- [ ] Refresh page
- [ ] **Verify**: Data loads successfully

### Loading States
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Reload `/platform`
- [ ] **Verify**: Loading spinner displays while data fetches
- [ ] **Verify**: Spinner disappears when data loads

### Invalid Routes
- [ ] Navigate to `/platform/invalid-route`
- [ ] **Verify**: 404 page or redirect to `/platform`
- [ ] Navigate to `/platform/companies/invalid-id`
- [ ] **Verify**: Error message or redirect

---

## 10. Performance & UX (10 minutes)

### Load Times
- [ ] Open DevTools → Network tab
- [ ] Clear cache and hard reload
- [ ] **Verify**: Platform dashboard loads in <3 seconds
- [ ] Navigate to Companies page
- [ ] **Verify**: Companies list loads in <2 seconds
- [ ] Open Company details
- [ ] **Verify**: Details load in <2 seconds

### Smooth Interactions
- [ ] Click through all navigation links
- [ ] **Verify**: No lag or freezing
- [ ] **Verify**: Transitions are smooth
- [ ] Filter/search in companies
- [ ] **Verify**: Filters apply instantly (<500ms)

### Console Warnings
- [ ] Open browser console
- [ ] Navigate through all platform pages
- [ ] **Verify**: No React warnings (e.g., key props)
- [ ] **Verify**: No propTypes errors
- [ ] **Verify**: No CORS errors
- [ ] **Verify**: No 404 errors for assets

---

## Testing Summary

### Completion Checklist
- [ ] All authentication tests passed
- [ ] All dashboard tests passed
- [ ] All navigation tests passed
- [ ] All companies page tests passed
- [ ] All company details tests passed
- [ ] All impersonation tests passed
- [ ] All audit logs tests passed
- [ ] All authorization tests passed
- [ ] All error handling tests passed
- [ ] All performance tests passed

### Issues Found
Document any issues here:

**Issue 1**: [Description]
- **Severity**: [Critical/High/Medium/Low]
- **Steps to reproduce**: [Steps]
- **Expected**: [What should happen]
- **Actual**: [What actually happens]

**Issue 2**: [Description]
- ...

### Test Results
- **Total Tests**: _____
- **Passed**: _____
- **Failed**: _____
- **Blocked**: _____

### Sign-off
- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Ready for deployment

**Tested by**: _______________
**Date**: _______________
**Signature**: _______________

---

## Quick Reference: Test URLs

- Platform Dashboard: `http://localhost:3000/platform`
- Companies List: `http://localhost:3000/platform/companies`
- Company Details: `http://localhost:3000/platform/companies/:id`
- Audit Logs: `http://localhost:3000/platform/audit-logs`

## Quick Reference: Test Credentials

**Super Admin**:
- Email: [your-super-admin-email]
- Password: [your-password]

**Company Admin** (for authorization testing):
- Email: [company-admin-email]
- Password: [password]

---

*Remember to test in both development and staging environments before production deployment.*
