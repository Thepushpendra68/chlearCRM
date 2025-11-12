# Workflow Library Setup Instructions

## Issue Resolved
The 404 error was caused by route ordering - `/workflow-templates/:id` was matching `/workflow-templates/packs` before the packs route could handle it.

## What Was Fixed
1. **Route ordering in `backend/src/routes/emailRoutes.js`**
   - Moved `/workflow-templates/packs` routes BEFORE `/workflow-templates/:id` routes
   - This prevents Express from treating "packs" as an ID parameter

2. **Database migration**
   - Replaced named UNIQUE constraint with IF NOT EXISTS unique index
   - Prevents "relation already exists" error on re-run

## Setup Steps

### 1. Run Database Migration
Execute in Supabase SQL Editor:
```sql
-- Run the entire file: migrations/20251101_workflow_library.sql
-- OR if tables already exist, just create the index:
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_templates_company_name 
  ON workflow_templates(company_id, name);
```

### 2. Restart Backend Server
```bash
cd backend
npm run dev
```

### 3. Verify Endpoints
Test these URLs (with valid auth token):
- GET /api/email/workflow-templates/packs → Should return packs list
- GET /api/email/workflow-templates → Should return templates list
- GET /api/email/sequences → Should return sequences (existing route for comparison)

### 4. Clear Browser Cache
- Hard refresh the frontend (Ctrl+F5 or Cmd+Shift+R)
- OR clear browser cache for localhost:5173

### 5. Test in UI
Navigate to: http://localhost:5173/app/email/workflow-library

## Expected Behavior
1. Workflow Library page loads with templates and packs tabs
2. Browse Templates button appears on Email Sequences page
3. Save as Template button appears in Email Sequence Builder
4. Templates can be:
   - Created from sequences
   - Imported from JSON files
   - Exported as JSON
   - Used to create new sequences

## Troubleshooting

### Still Getting 404?
1. **Check server is running**: `netstat -ano | findstr :5000`
2. **Check route exists**: Add console.log in workflowTemplateController.getTemplatePacks
3. **Check auth token**: Open DevTools → Application → Local Storage → check token exists
4. **Check API base URL**: Verify frontend is calling localhost:5000 not a different port

### Authentication Error (401)?
- Token expired or missing
- Log out and log back in to refresh token

### Templates Not Loading?
- Run migration: tables must exist
- Check Supabase connection in backend
- Verify RLS policies are enabled

## Files Created/Modified

### Backend
- ✅ `backend/src/services/workflowTemplateService.js` (new)
- ✅ `backend/src/controllers/workflowTemplateController.js` (new)
- ✅ `backend/src/routes/emailRoutes.js` (modified - route order fixed)

### Frontend
- ✅ `frontend/src/pages/WorkflowLibrary.jsx` (new)
- ✅ `frontend/src/services/emailService.js` (modified - added workflow methods)
- ✅ `frontend/src/pages/EmailSequences.jsx` (modified - added Browse Templates button)
- ✅ `frontend/src/pages/EmailSequenceBuilder.jsx` (modified - added Save as Template button)
- ✅ `frontend/src/App.jsx` (modified - added route)

### Database
- ✅ `migrations/20251101_workflow_library.sql` (new)

## Quick Verification Commands

```bash
# Backend running?
curl http://localhost:5000/api/email/sequences

# Workflow templates endpoint?
curl http://localhost:5000/api/email/workflow-templates/packs

# Frontend running?
curl http://localhost:5173
```

## Default Templates Included
1. Welcome Sequence (3 steps)
2. Lead Nurture Sequence (5 steps)
3. Demo Booking Sequence (3 steps)
4. Abandoned Cart Recovery (3 steps)

## Industry Packs
1. Real Estate Agent Pack
2. Education Institution Pack
3. Healthcare Provider Pack

