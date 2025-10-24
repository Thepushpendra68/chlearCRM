# Super Admin Platform - Quick Reference Card

**Print this page for quick access to common operations**

---

## 🔑 Creating a Super Admin User

```sql
-- Replace USER_EMAIL with actual email
BEGIN;

UPDATE user_profiles
SET role = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL');

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'USER_EMAIL';

COMMIT;
```

**Important**: User must logout and login again after role change.

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
node test-super-admin.js
```

### Frontend Tests
Follow: `FRONTEND_TESTING_CHECKLIST.md`

---

## 🚀 Deployment Commands

### Deploy Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Deploy Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

---

## 📊 Useful SQL Queries

### Check Super Admins
```sql
SELECT id, email, raw_app_meta_data->>'role'
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'super_admin';
```

### Recent Audit Logs
```sql
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Critical Audit Events
```sql
SELECT * FROM audit_logs
WHERE severity = 'critical'
AND created_at > NOW() - INTERVAL '24 hours';
```

### Platform Statistics
```sql
SELECT * FROM platform_overview_stats;
```

### Company Statistics
```sql
SELECT * FROM platform_company_stats
ORDER BY total_users DESC
LIMIT 10;
```

### Impersonation Activity
```sql
SELECT * FROM audit_logs
WHERE is_impersonation = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Security Checks

### Verify RLS Policies
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('audit_logs', 'companies', 'user_profiles');
```
All should have `rowsecurity = true`

### Check Failed Access Attempts
```sql
SELECT * FROM audit_logs
WHERE severity = 'critical'
AND action LIKE '%failed%'
ORDER BY created_at DESC;
```

---

## 🔄 Emergency Procedures

### Disable Platform (Feature Flag)
**Backend** - Set environment variable:
```bash
PLATFORM_ENABLED=false
```

**Frontend** - Set environment variable:
```bash
VITE_PLATFORM_ENABLED=false
```

### Quick Rollback (Frontend Only)
```bash
# In Vercel Dashboard
# Go to: Deployments → Previous Deployment → Promote
```

### Revoke Super Admin Access
```sql
BEGIN;

UPDATE user_profiles
SET role = 'company_admin'
WHERE id = 'USER_ID';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "company_admin"}'::jsonb
WHERE id = 'USER_ID';

COMMIT;
```

---

## 🐛 Troubleshooting

### Super admin can't access platform
```bash
# 1. Check role in database (see "Check Super Admins" above)
# 2. User must logout and login again
# 3. Check JWT token includes role claim
# 4. Check backend logs for 403 errors
```

### Audit logs not being created
```bash
# 1. Check backend logs for errors
# 2. Verify audit_logs table exists
# 3. Check RLS policies (see "Verify RLS Policies" above)
# 4. Test direct insert in SQL
```

### Impersonation not working
```bash
# 1. Check impersonation middleware registered
# 2. Verify x-impersonate-user-id header being sent
# 3. Check audit logs for impersonation attempts
# 4. Test with curl:
curl http://localhost:5000/api/leads \
  -H "Authorization: Bearer TOKEN" \
  -H "x-impersonate-user-id: USER_ID"
```

---

## 📞 API Endpoints

### Platform Statistics
```
GET /api/platform/stats
Authorization: Bearer {token}
```

### List Companies
```
GET /api/platform/companies?page=1&limit=20&search=&status=
Authorization: Bearer {token}
```

### Company Details
```
GET /api/platform/companies/:companyId
Authorization: Bearer {token}
```

### Update Company Status
```
PUT /api/platform/companies/:companyId/status
Authorization: Bearer {token}
Body: { "status": "active|trial|suspended|cancelled", "reason": "..." }
```

### Search Users
```
GET /api/platform/users/search?search=&company_id=&role=&limit=20
Authorization: Bearer {token}
```

### Get Audit Logs
```
GET /api/platform/audit-logs?page=1&limit=50&severity=&action=
Authorization: Bearer {token}
```

### End Impersonation
```
POST /api/platform/impersonate/end
Authorization: Bearer {token}
```

---

## 🛠️ Maintenance Tasks

### Daily (First Week)
- [ ] Check audit logs for anomalies
- [ ] Monitor error rates
- [ ] Verify super admin access working

### Weekly
- [ ] Review audit log trends
- [ ] Check for unauthorized access attempts
- [ ] Monitor query performance

### Monthly
- [ ] Security audit
- [ ] Review super admin actions
- [ ] Update documentation

---

## 📱 Frontend URLs

- Platform Dashboard: `/platform`
- Companies List: `/platform/companies`
- Company Details: `/platform/companies/:id`
- Audit Logs: `/platform/audit-logs`

---

## 🔢 Important Thresholds

### Rate Limits
- Platform routes: 500 requests / 15 minutes
- Status updates: 50 requests / 15 minutes

### Performance Targets
- Dashboard load: <2 seconds
- Companies list: <2 seconds
- Company details: <2 seconds
- Audit logs query: <1 second

### Alert Thresholds
- Error rate >5%: Warning
- Error rate >10%: Critical
- Response time >3s: Warning
- Response time >5s: Critical

---

## 📋 Pre-Flight Checklist

Before any platform changes:
- [ ] Test in staging environment
- [ ] Backup audit logs (if needed)
- [ ] Notify stakeholders
- [ ] Review rollback plan
- [ ] Schedule deployment window
- [ ] Prepare monitoring

---

## 📚 Documentation Links

- Implementation Guide: `SUPER_ADMIN_IMPLEMENTATION.md`
- Testing Guide: `TESTING_DEPLOYMENT_GUIDE.md`
- Deployment Guide: `deploy-super-admin.md`
- Rollback Script: `rollback-super-admin.sql`
- Completion Summary: `SUPER_ADMIN_COMPLETION_SUMMARY.md`

---

## ⚡ Quick Actions

### Test Backend Health
```bash
curl http://localhost:5000/health
```

### Test Platform Access
```bash
curl http://localhost:5000/api/platform/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Backend Logs
```bash
# Development
cd backend
npm run dev

# Production (Vercel)
vercel logs --follow
```

### Clear Frontend Cache
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## 🎯 Success Metrics

Track these KPIs:
- Number of super admins
- Platform access frequency
- Impersonation usage
- Audit log growth rate
- Average response times
- Error rates
- Failed access attempts

---

## ☎️ Emergency Contacts

**Technical Issues**:
- Backend Lead: [Contact]
- Frontend Lead: [Contact]
- DevOps: [Contact]

**Security Issues**:
- Security Team: [Contact]
- Incident Response: [Contact]

**Business Issues**:
- Product Owner: [Contact]
- Project Manager: [Contact]

---

## 💡 Best Practices

1. **Always** test in staging first
2. **Always** backup before major changes
3. **Always** review audit logs after deployment
4. **Always** communicate with stakeholders
5. **Never** modify audit logs directly
6. **Never** share super admin credentials
7. **Never** skip security checks
8. **Never** deploy without testing

---

## ⏰ Standard Operating Procedures

### Creating a New Super Admin
1. Verify user exists and is trusted
2. Run SQL to update role (see top of this document)
3. User logs out and logs in again
4. Verify access to platform
5. Document in audit trail

### Revoking Super Admin Access
1. Run SQL to revert role (see Emergency Procedures)
2. User logs out
3. Verify platform access blocked
4. Document reason in audit log
5. Notify user of access change

### Investigating Suspicious Activity
1. Check audit logs for user's actions
2. Look for unusual patterns (impersonation, status changes)
3. Verify user's identity and authority
4. Document findings
5. Escalate if needed

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Print Date**: __________

---

*Keep this card handy for quick reference during daily operations*
