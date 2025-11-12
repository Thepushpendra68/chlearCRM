# Email Automation System - Implementation Guide

## Overview

This document provides a comprehensive guide to the email automation and template management system implemented in the CRM. The system includes:

- **Email Template Management** with code (MJML) and visual (GrapesJS) editors
- **One-off Email Sending** to leads with merge variables
- **Email Sequences** with visual workflow builder (n8n-style)
- **Email Tracking** (opens, clicks, bounces)
- **Email Analytics Dashboard**
- **Integration with Postmark** (SendGrid/SES support ready)

---

## Architecture

### Backend Components

#### 1. Database Schema (`migrations/20251031_email_templates_and_automation.sql`)

**Tables:**
- `integration_settings` - Email provider configuration per company
- `email_templates` - Template metadata
- `email_template_versions` - Version control for templates (MJML, HTML, design JSON)
- `outbound_messages` - All sent emails with tracking metrics
- `email_sequences` - Automated sequence definitions
- `sequence_enrollments` - Tracks leads in sequences
- `automation_rules` - General automation rules (future extensibility)
- `email_suppression_list` - Unsubscribe/bounce management

**Key Features:**
- Multi-tenancy via `company_id`
- RLS (Row Level Security) policies
- Version control for templates
- Comprehensive email tracking
- Audit trails

#### 2. Services (`backend/src/services/`)

**emailTemplateService.js**
- Template CRUD operations
- MJML compilation to HTML
- Merge variable extraction
- Version management
- Folder organization

**emailSendService.js**
- Email sending via Postmark
- Merge variable substitution (Handlebars)
- Activity logging
- Suppression list checking
- Retry logic with exponential backoff
- Rate limiting (100 req/min per company)

**automationService.js**
- Sequence management
- Enrollment tracking
- Condition evaluation
- Step processing
- Trigger event handling

#### 3. Controllers (`backend/src/controllers/`)

**emailTemplateController.js**
- GET `/api/email/templates` - List templates
- GET `/api/email/templates/:id` - Get template details
- POST `/api/email/templates` - Create template
- PUT `/api/email/templates/:id` - Update template
- DELETE `/api/email/templates/:id` - Delete template
- POST `/api/email/templates/:id/versions` - Create version
- POST `/api/email/templates/versions/:id/publish` - Publish version
- POST `/api/email/templates/compile-mjml` - Compile MJML to HTML

**emailSendController.js**
- POST `/api/email/send/lead` - Send email to lead
- POST `/api/email/send/custom` - Send to custom email
- GET `/api/email/sent` - List sent emails
- GET `/api/email/sent/:id` - Get email details

**automationController.js**
- GET `/api/email/sequences` - List sequences
- GET `/api/email/sequences/:id` - Get sequence
- POST `/api/email/sequences` - Create sequence
- PUT `/api/email/sequences/:id` - Update sequence
- DELETE `/api/email/sequences/:id` - Delete sequence
- POST `/api/email/sequences/:id/enroll` - Enroll lead
- POST `/api/email/enrollments/:id/unenroll` - Unenroll lead

**emailWebhookController.js**
- POST `/api/email/webhooks/postmark` - Postmark webhook handler
- POST `/api/email/webhooks/sendgrid` - SendGrid webhook handler

#### 4. Background Worker (`backend/src/workers/emailSequenceWorker.js`)

- Runs every minute via `node-cron`
- Processes pending sequence enrollments
- Evaluates wait times and conditions
- Triggers email sends
- Updates enrollment status

---

### Frontend Components

#### 1. Pages

**EmailSettings.jsx** (`/app/email/settings`)
- Email provider configuration (Postmark API key)
- From email, name, reply-to settings
- Webhook URL display
- Company admin only

**EmailTemplates.jsx** (`/app/email/templates`)
- Template list with grid view
- Filter by folder, category, status
- Search functionality
- Template CRUD actions
- Folder organization

**EmailTemplateEditor.jsx** (`/app/email/templates/:id`)
- Dual-mode editor: Code (Monaco + MJML) and Visual (GrapesJS)
- Real-time MJML compilation
- Email preview with merge variables
- Version management
- Template metadata editing

**EmailSequences.jsx** (`/app/email/sequences`)
- Sequence list view
- Active/inactive filtering
- Step preview
- Enrollment counts
- Sequence management

**EmailSequenceBuilder.jsx** (`/app/email/sequences/:id`)
- Visual workflow builder with React Flow
- Node types: Email, Wait, Condition
- Drag-and-drop interface
- Node property editing
- Auto-connect nodes

**EmailAnalytics.jsx** (`/app/email/analytics`)
- Email performance metrics
- Open rate, click rate, bounce rate
- Industry benchmarks comparison
- Recent emails table with tracking status
- Visual progress bars

#### 2. Components

**SendEmailModal.jsx**
- Modal for sending one-off emails to leads
- Template selection
- Email preview
- Custom merge variables
- Integrated in LeadDetail page

#### 3. Services

**emailService.js**
- Axios-based API client
- All email-related API calls
- Template operations
- Sending operations
- Sequence operations
- Suppression list management

---

## Setup Instructions

### Backend Setup

1. **Run the migration:**
   ```bash
   cd backend
   # Apply the SQL migration to your Supabase database
   # You can run the SQL from migrations/20251031_email_templates_and_automation.sql
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```env
   # Add to backend/.env
   POSTMARK_API_KEY=your_postmark_server_token
   POSTMARK_FROM_EMAIL=noreply@yourdomain.com
   POSTMARK_FROM_NAME=Your Company
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

The email sequence worker will start automatically.

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

### Postmark Setup

1. **Sign up at [Postmarkapp.com](https://postmarkapp.com)**

2. **Create a Server** and get your Server API Token

3. **Verify your sender domain or email address**
   - Add and verify your sending domain (recommended)
   - Or verify individual email addresses

4. **Configure webhook (for tracking):**
   - In Postmark Server settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/email/webhooks/postmark`
   - Select events: Open, Click, Bounce, SpamComplaint

5. **Enter API token in CRM:**
   - Navigate to `/app/email/settings`
   - Enter your Postmark Server API Token
   - Configure from email, name, and reply-to

---

## Usage Guide

### Creating Email Templates

1. **Navigate to Email Templates** (`/app/email/templates`)

2. **Click "New Template"**

3. **Fill in template metadata:**
   - Name (required)
   - Subject (required)
   - Category (general, welcome, follow-up, etc.)
   - Folder (optional, for organization)
   - Description (optional)

4. **Choose editor mode:**
   - **Code Mode**: Write MJML code directly with Monaco editor
   - **Visual Mode**: Use GrapesJS drag-and-drop builder

5. **Add merge variables:**
   ```handlebars
   Hello {{lead.name}},
   
   Your company: {{lead.company}}
   Email: {{lead.email}}
   Phone: {{lead.phone}}
   Title: {{lead.title}}
   ```

6. **Preview the email** with sample data

7. **Save & Publish** to make it available for sending

### Sending One-Off Emails

1. **Open a lead detail page** (`/app/leads/:id`)

2. **Click "Send Email" button**

3. **Select an email template** from the dropdown

4. **Preview the email** with lead's actual data

5. **Add custom variables** (optional) as JSON

6. **Click "Send Email"**

The email will be sent and logged as an activity on the lead.

### Creating Email Sequences

1. **Navigate to Email Sequences** (`/app/email/sequences`)

2. **Click "New Sequence"**

3. **Enter sequence details:**
   - Name (required)
   - Description (optional)

4. **Build the workflow:**
   - Trigger node is automatically added
   - Add Email nodes (select template)
   - Add Wait nodes (days/hours)
   - Add Condition nodes (field, operator, value)

5. **Connect nodes** by dragging from one to another

6. **Configure each step:**
   - Click on a node to edit its properties
   - For Email: select template
   - For Wait: set days and hours
   - For Condition: set field, operator, and value

7. **Save Sequence**

8. **Activate the sequence** by toggling status

### Enrolling Leads in Sequences

**Option 1: From Sequence Page**
1. Open sequence details
2. Click "Enroll Lead"
3. Select lead from dropdown
4. Confirm enrollment

**Option 2: Via API** (for automation)
```javascript
POST /api/email/sequences/:id/enroll
{
  "lead_id": "lead-uuid"
}
```

### Viewing Email Analytics

1. **Navigate to Email Analytics** (`/app/email/analytics`)

2. **View key metrics:**
   - Total sent
   - Delivery rate
   - Open rate
   - Click rate
   - Bounce rate

3. **Compare with industry benchmarks**
   - Average open rate: 20-25%
   - Average click rate: 2-5%

4. **Review recent emails table:**
   - See opened/clicked timestamps
   - Check delivery status
   - Filter by status

---

## Merge Variables

### Available Lead Fields

```handlebars
{{lead.name}}           # Full name (first + last)
{{lead.first_name}}     # First name
{{lead.last_name}}      # Last name
{{lead.email}}          # Email address
{{lead.phone}}          # Phone number
{{lead.company}}        # Company name
{{lead.title}}          # Job title
{{lead.status}}         # Lead status
{{lead.source}}         # Lead source
{{lead.deal_value}}     # Deal value
```

### Custom Fields

```handlebars
{{custom.field_name}}   # Custom field value
```

### System Variables

```handlebars
{{company.name}}        # Your company name
{{user.name}}           # Assigned user name
{{unsubscribe_url}}     # Unsubscribe link (auto-generated)
```

---

## MJML Template Example

```xml
<mjml>
  <mj-head>
    <mj-title>Welcome to Our Platform</mj-title>
    <mj-preview>Get started with your account</mj-preview>
  </mj-head>
  <mj-body>
    <!-- Header -->
    <mj-section background-color="#f0f0f0">
      <mj-column>
        <mj-text font-size="24px" font-weight="bold" align="center">
          Welcome, {{lead.name}}!
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Content -->
    <mj-section>
      <mj-column>
        <mj-text font-size="16px">
          Hi {{lead.first_name}},
        </mj-text>
        <mj-text font-size="16px">
          Thank you for signing up! We're excited to have you at {{lead.company}}.
        </mj-text>
        <mj-button background-color="#2563eb" href="https://yoursite.com/dashboard">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section background-color="#f0f0f0">
      <mj-column>
        <mj-text font-size="12px" color="#666666" align="center">
          {{company.name}} | <a href="{{unsubscribe_url}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

---

## Sequence Example

**Welcome Sequence:**

1. **Trigger**: Lead created
2. **Email 1**: Welcome email (Template: "Welcome")
3. **Wait**: 1 day
4. **Condition**: If status = "new"
   - **Email 2**: Follow-up email (Template: "Follow-up Day 2")
5. **Wait**: 3 days
6. **Email 3**: Case study email (Template: "Social Proof")

---

## Email Tracking

### How It Works

1. **Sending**: When an email is sent, a record is created in `outbound_messages`

2. **Tracking Pixel**: Postmark adds a tracking pixel to the email

3. **Link Tracking**: All links are rewritten to track clicks

4. **Webhooks**: Postmark sends events to `/api/email/webhooks/postmark`:
   - **Open**: User opened the email
   - **Click**: User clicked a link
   - **Bounce**: Email bounced
   - **SpamComplaint**: Marked as spam

5. **Database Update**: Webhook handler updates `outbound_messages` table

6. **Activity Logging**: Email events are logged as activities on leads

---

## Best Practices

### Template Design

1. **Keep it simple**: Focus on one CTA (call-to-action)
2. **Mobile-first**: Test on mobile devices
3. **Plain text version**: Always provide alt text
4. **Unsubscribe link**: Always include opt-out option
5. **Brand consistency**: Use your brand colors and fonts

### Email Sending

1. **Warm up your domain**: Start with low volumes, increase gradually
2. **Avoid spam triggers**: No ALL CAPS, excessive punctuation
3. **Personalize**: Use merge variables effectively
4. **Test first**: Always send test emails before going live
5. **Monitor metrics**: Track opens, clicks, bounces

### Sequences

1. **Time your sends**: Send during business hours (9 AM - 5 PM)
2. **Space out emails**: Don't overwhelm recipients
3. **Use conditions**: Make sequences intelligent
4. **A/B test**: Try different subject lines and content
5. **Respect unsubscribes**: Immediately stop sending

### Deliverability

1. **SPF/DKIM/DMARC**: Configure email authentication
2. **Clean your list**: Remove bounced emails
3. **Engagement**: Remove inactive contacts
4. **Reputation**: Monitor sender score
5. **Compliance**: Follow CAN-SPAM, GDPR rules

---

## Troubleshooting

### Emails Not Sending

1. **Check email settings**: `/app/email/settings`
2. **Verify API key**: Test connection in settings
3. **Check from email**: Must be verified in Postmark
4. **Review logs**: Check backend console for errors
5. **Suppression list**: Check if recipient is suppressed

### Template Errors

1. **MJML syntax**: Use "Compile MJML" button to validate
2. **Merge variables**: Ensure correct syntax `{{lead.field}}`
3. **Images**: Use absolute URLs for images
4. **Preview**: Always preview before publishing

### Tracking Not Working

1. **Webhook configured**: Check Postmark webhook settings
2. **HTTPS required**: Webhook URL must be HTTPS
3. **Webhook secret**: Verify signature (if configured)
4. **Check logs**: Review webhook handler logs

### Sequence Issues

1. **Worker running**: Ensure cron worker is active
2. **Sequence active**: Check if sequence is activated
3. **Conditions**: Verify condition logic
4. **Templates published**: Ensure templates have published versions

---

## API Reference

### Send Email to Lead

```http
POST /api/email/send/lead
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": "uuid",
  "template_version_id": "uuid",
  "custom_data": {
    "custom_field": "value"
  }
}
```

### Create Template

```http
POST /api/email/templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Welcome Email",
  "subject": "Welcome to {{company.name}}!",
  "category": "welcome",
  "folder": "Onboarding",
  "description": "Sent to new leads",
  "is_active": true
}
```

### Enroll in Sequence

```http
POST /api/email/sequences/{sequence_id}/enroll
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": "uuid"
}
```

---

## Future Enhancements

### Planned Features

1. **A/B Testing**: Split test subject lines and content
2. **Advanced Segmentation**: Target by lead properties
3. **Email Scheduler**: Schedule sends for specific times
4. **Dynamic Content**: Show different content to different segments
5. **Multi-language**: Support for international templates
6. **Email Builder Blocks**: Pre-built template sections
7. **AI Content Generation**: Generate email copy with AI
8. **Advanced Analytics**: Funnel analysis, cohort reports
9. **SMS Integration**: Add SMS to sequences
10. **Slack Integration**: Notify team of email events

### SendGrid Integration

Add to `backend/src/services/emailSendService.js`:

```javascript
async sendViaSendGrid(to, subject, html, from) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to,
    from,
    subject,
    html,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    }
  };
  
  await sgMail.send(msg);
}
```

---

## Dependencies

### Backend

```json
{
  "postmark": "^4.0.2",
  "mjml": "^4.14.1",
  "handlebars": "^4.7.8",
  "date-fns": "^3.0.0",
  "zod": "^3.22.4",
  "express-rate-limit": "^7.1.5",
  "p-retry": "^6.1.0",
  "bottleneck": "^2.19.5",
  "sanitize-html": "^2.11.0",
  "html-minifier": "^4.0.0",
  "node-cron": "^3.0.3",
  "validator": "^13.11.0"
}
```

### Frontend

```json
{
  "@monaco-editor/react": "^4.6.0",
  "@tanstack/react-query": "^5.17.0",
  "grapesjs": "^0.21.8",
  "grapesjs-preset-newsletter": "^1.0.2",
  "reactflow": "^11.10.4"
}
```

---

## Support

For questions or issues:
- Check the troubleshooting section
- Review backend/frontend console logs
- Check Postmark delivery logs
- Review sequence enrollment status

---

**Last Updated**: October 31, 2025
**Version**: 1.0.0
**Author**: CRM Development Team

