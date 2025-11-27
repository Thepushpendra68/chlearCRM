# 🚀 WhatsApp Integration Deployment Checklist

## Pre-Deployment

### 1. Database Migration ✅
- [x] Run `migrations/20250115_whatsapp_meta_integration.sql` in Supabase
- [x] Verify tables created successfully
- [x] Check constraints and indexes

### 2. Backend Environment Variables ✅
Add to `backend/.env` or Vercel environment variables:

```bash
META_WHATSAPP_ACCESS_TOKEN=EAAKJE4CSuHEBPZCSmyQMobBe6p9W8zhZBHR9SISHrijOEngI0qWdtU1EBZBx8ZBl37k12fg1xPys8ZB3ibxionSRZC7eZCprqHxc4f4UOBy7VGIplaYMiYyHqXhY1n3nq6dp3LfINwECo9WovUV2T712esorLBV3yB5ZBCeN3YngneKpFvYRZBR1khCzA2nsX4f1yZCFAQhkCQz8VuttPSsdAcKZA3gCqBIPSZB3gky76AWxPgZDZD
META_WHATSAPP_PHONE_NUMBER_ID=754391564431502
META_WHATSAPP_BUSINESS_ACCOUNT_ID=1779313026310884
META_WHATSAPP_APP_SECRET=ca13696e2b7b91f712be7ac495a5bcd1
META_WHATSAPP_VERIFY_TOKEN=chlear_whatsapp_webhook_2025
```

- [x] Variables added to `.env`
- [ ] Variables added to Vercel (if deploying to production)

### 3. Backend Code ✅
- [x] Services created (`whatsappMetaService.js`, `whatsappSendService.js`, `whatsappWebhookService.js`)
- [x] Controllers created (`whatsappController.js`, `whatsappWebhookController.js`)
- [x] Routes registered (`whatsappRoutes.js` in `app.js`)
- [x] Activity service updated (added 'whatsapp' type)

### 4. Frontend Code ✅
- [x] WhatsApp service created (`whatsappService.js`)
- [x] Components created (WhatsAppMessage, ChatInterface, SendWhatsAppModal)
- [x] Inbox page created (`WhatsApp.jsx`)
- [x] Routes configured (`App.jsx`)
- [x] Sidebar updated (navigation item + badge)
- [x] Lead detail updated (Send WhatsApp button)

---

## Deployment Steps

### Step 1: Build & Deploy Backend
```bash
# If using Vercel
cd backend
npm install
vercel deploy --prod

# If using separate backend server
cd backend
npm install
npm run build
pm2 restart backend  # or your process manager
```

- [ ] Backend deployed successfully
- [ ] API endpoints accessible
- [ ] Environment variables loaded

### Step 2: Build & Deploy Frontend
```bash
cd frontend
npm install
npm run build

# If using Vercel
vercel deploy --prod

# If deploying to other hosting
# Upload dist/ folder to your hosting
```

- [ ] Frontend deployed successfully
- [ ] Assets loaded correctly
- [ ] Routes working

### Step 3: Configure Meta Webhook
1. Go to: https://developers.facebook.com/apps/713666807904369/
2. Navigate to: **WhatsApp → Configuration**
3. Webhook Settings:
   - **Callback URL**: `https://chlear-crm.vercel.app/api/whatsapp/webhooks/meta`
   - **Verify Token**: `chlear_whatsapp_webhook_2025`
   - Click **Verify and Save**
4. Subscribe to webhook fields:
   - ☑️ `messages`
   - ☑️ `message_status`

- [ ] Webhook URL verified
- [ ] Subscription confirmed
- [ ] Test webhook received

---

## Post-Deployment Testing

### Functionality Tests

#### 1. Send Message Test
- [ ] Navigate to a lead with phone number
- [ ] Click "Send WhatsApp" button
- [ ] Enter test message
- [ ] Send message
- [ ] Verify success toast
- [ ] Check message in `whatsapp_messages` table
- [ ] Verify activity logged in `activities` table

#### 2. Receive Message Test
- [ ] Send WhatsApp message from your phone to business number
- [ ] Check webhook receives message (check logs)
- [ ] Verify message saved in `whatsapp_messages` table
- [ ] Check lead created/updated in `leads` table
- [ ] Verify activity logged

#### 3. Inbox Test
- [ ] Navigate to `/app/whatsapp`
- [ ] Verify conversations list loads
- [ ] Click on a conversation
- [ ] Verify messages display correctly
- [ ] Send a message from inbox
- [ ] Verify message sent successfully

#### 4. Badge Count Test
- [ ] Send/receive messages
- [ ] Check sidebar badge updates
- [ ] Verify count is accurate
- [ ] Mark conversation as read
- [ ] Verify badge decrements

#### 5. Activity Timeline Test
- [ ] Open lead detail page
- [ ] Scroll to activities section
- [ ] Verify WhatsApp messages appear
- [ ] Check message content displays
- [ ] Verify timestamps correct

---

## Database Verification

### Tables Check
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'whatsapp_%';

-- Should return:
-- whatsapp_messages
-- whatsapp_templates
-- whatsapp_conversations
-- whatsapp_sequences
-- whatsapp_sequence_enrollments
```

- [ ] All 5 tables exist
- [ ] Indexes created
- [ ] Constraints applied

### Integration Settings Check
```sql
SELECT company_id, type, is_active 
FROM integration_settings 
WHERE type = 'whatsapp';
```

- [ ] All companies have WhatsApp settings
- [ ] `is_active = true`
- [ ] Credentials present

---

## Security Verification

### Backend
- [ ] Webhook signature verification working
- [ ] JWT authentication on protected routes
- [ ] Environment variables not exposed
- [ ] Error messages sanitized
- [ ] Rate limiting active

### Frontend
- [ ] API calls use authentication headers
- [ ] Phone numbers validated
- [ ] User input sanitized
- [ ] XSS protection in place

---

## Performance Check

### Backend
- [ ] API response time < 500ms
- [ ] Webhook processing < 1s
- [ ] Database queries optimized
- [ ] No N+1 queries

### Frontend
- [ ] Page load time < 2s
- [ ] Chat scroll smooth
- [ ] Badge updates efficient
- [ ] No memory leaks

---

## Monitoring Setup

### Backend Logs
```bash
# Check for WhatsApp-related logs
grep -i "whatsapp" logs/backend.log

# Check webhook logs
grep -i "webhook" logs/backend.log
```

- [ ] Logging configured
- [ ] Error tracking active
- [ ] Webhook events logged

### Database Monitoring
```sql
-- Check message volume
SELECT COUNT(*) FROM whatsapp_messages;

-- Check conversation count
SELECT COUNT(*) FROM whatsapp_conversations;

-- Check recent activity
SELECT * FROM whatsapp_messages 
ORDER BY created_at DESC LIMIT 10;
```

- [ ] Queries running efficiently
- [ ] Data populating correctly
- [ ] No orphaned records

---

## User Training

### For Sales Reps
- [ ] How to send WhatsApp messages
- [ ] How to view conversation history
- [ ] How to use quick actions
- [ ] Understanding message status

### For Managers
- [ ] How to monitor team conversations
- [ ] How to access WhatsApp inbox
- [ ] How to review analytics (future)
- [ ] How to manage settings

---

## Rollback Plan

If issues occur:

### 1. Disable WhatsApp Integration
```sql
UPDATE integration_settings 
SET is_active = false 
WHERE type = 'whatsapp';
```

### 2. Remove From Navigation (if needed)
Comment out in `Sidebar.jsx`:
```javascript
// {
//   name: "WhatsApp",
//   href: "/app/whatsapp",
//   icon: ChatBubbleLeftRightIcon,
//   badge: badgeCounts.whatsapp || null,
// },
```

### 3. Unsubscribe Webhook
1. Go to Meta App Dashboard
2. Unsubscribe from webhook events
3. Remove callback URL

---

## Success Criteria

### Technical
- ✅ All API endpoints responding
- ✅ Webhook receiving events
- ✅ Messages sending successfully
- ✅ Database tables populated
- ✅ Frontend components loading
- ✅ No console errors
- ✅ No linter errors

### Business
- ✅ Users can send messages
- ✅ Users can receive messages
- ✅ Conversations tracked
- ✅ Activities logged
- ✅ Badge counts accurate
- ✅ Performance acceptable
- ✅ User feedback positive

---

## Support & Troubleshooting

### Common Issues

#### Issue: Webhook verification fails
**Solution:** Check verify token matches exactly in Meta dashboard and `.env`

#### Issue: Messages not sending
**Solution:** Verify access token is valid and phone number format is correct

#### Issue: Badge count not updating
**Solution:** Check `/api/dashboard/badge-counts` endpoint and refresh interval

#### Issue: Activities not showing
**Solution:** Verify `activityService.js` has 'whatsapp' in valid types array

#### Issue: Conversation not found
**Solution:** Check `whatsapp_conversations` table and phone number format

---

## Documentation Links

- **Backend Implementation:** `WHATSAPP_INTEGRATION_COMPLETE.md`
- **Frontend Implementation:** `WHATSAPP_FRONTEND_COMPLETE.md`
- **Quick Start Guide:** `WHATSAPP_QUICK_START.md`
- **Configuration Guide:** `WHATSAPP_CONFIGURATION_GUIDE.md`

---

## Sign-Off

### Deployment Team
- [ ] Backend Developer - Code deployed & tested
- [ ] Frontend Developer - UI deployed & tested
- [ ] DevOps - Infrastructure verified
- [ ] QA - Testing completed
- [ ] Product Manager - Features approved

### Production Release
- [ ] Staging tested successfully
- [ ] Production deployed
- [ ] Monitoring active
- [ ] Team trained
- [ ] Users notified

**Date:** _________________  
**Deployed By:** _________________  
**Approved By:** _________________  

---

## 🎉 Deployment Complete!

**Your WhatsApp integration is now live!** 🚀

Monitor the system for the first 24-48 hours and collect user feedback.

