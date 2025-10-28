# 🚀 Lead Capture API - Integration Guide

**Welcome!** This guide will help you integrate your landing pages, websites, and forms with our CRM system to automatically capture leads.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Getting Your API Credentials](#getting-your-api-credentials)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Integration Examples](#integration-examples)
6. [Custom Fields](#custom-fields)
7. [Error Handling](#error-handling)
8. [Rate Limits](#rate-limits)
9. [Best Practices](#best-practices)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

**Want to get started fast?** Follow these 3 steps:

### Step 1: Get Your API Credentials
Contact your CRM admin to generate API credentials for your landing page.

### Step 2: Add This Code to Your Form
```html
<form id="leadForm">
  <input type="text" name="first_name" placeholder="First Name" required>
  <input type="text" name="last_name" placeholder="Last Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <input type="tel" name="phone" placeholder="Phone">
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  const response = await fetch('YOUR_CRM_URL/api/v1/capture/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'YOUR_API_KEY',
      'X-API-Secret': 'YOUR_API_SECRET'
    },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    alert('Thank you! We will contact you soon.');
    e.target.reset();
  } else {
    alert('Something went wrong. Please try again.');
  }
});
</script>
```

### Step 3: Replace Placeholders
- `YOUR_CRM_URL` - Your CRM URL (e.g., `https://yourcrm.com`)
- `YOUR_API_KEY` - Your API Key (starts with `ck_`)
- `YOUR_API_SECRET` - Your API Secret

That's it! 🎉 Your form is now connected to the CRM.

---

## 🔑 Getting Your API Credentials

### For CRM Admins

1. **Login to your CRM** as an administrator
2. **Navigate to Settings** → **API Clients**
3. **Click "Create API Client"**
4. **Fill in the details:**
   - **Client Name**: Name of your landing page (e.g., "Homepage Contact Form")
   - **Rate Limit**: Requests per hour (default: 100)
   - **Allowed Origins**: Your website domain (e.g., `https://yourwebsite.com`)
   - **Default Lead Source**: Tag for these leads (e.g., "website")
   - **Auto-assign to**: Optionally assign leads to a specific user

5. **Click "Create"**
6. **⚠️ IMPORTANT:** Copy the **API Secret** immediately - it won't be shown again!

### What You'll Receive

```json
{
  "api_key": "ck_abc123xyz456...",
  "api_secret": "secret_def789uvw012..."
}
```

**🔒 Security Notes:**
- Never commit API credentials to Git
- Never expose credentials in client-side JavaScript (see security section)
- Store credentials in environment variables
- Regenerate credentials if compromised

---

## 🔐 Authentication

All API requests must include authentication headers:

```http
X-API-Key: ck_your_api_key_here
X-API-Secret: your_api_secret_here
```

### Example Request
```javascript
fetch('https://yourcrm.com/api/v1/capture/lead', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'ck_abc123...',
    'X-API-Secret': 'secret_def456...'
  },
  body: JSON.stringify({ /* lead data */ })
});
```

---

## 🌐 API Endpoints

### Base URL
```
https://yourcrm.com/api/v1/capture
```

### 1. Capture Single Lead
**Endpoint:** `POST /lead`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "job_title": "Marketing Manager",
  "lead_source": "website",
  "notes": "Interested in Enterprise plan",
  "custom_fields": {
    "budget": "$10,000",
    "timeline": "Q1 2024",
    "company_size": "50-100"
  }
}
```

**Required Fields:**
- `first_name` (string)
- `last_name` (string)
- `email` OR `phone` (at least one required)

**Optional Fields:**
- `company` (string)
- `job_title` (string)
- `lead_source` (string) - defaults to your API client's default
- `notes` (string)
- `custom_fields` (object) - any additional data you want to store

**Response (Success):**
```json
{
  "success": true,
  "message": "Lead captured successfully",
  "data": {
    "lead_id": "uuid-here",
    "status": "new"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "message": "First name and last name are required",
    "code": "VALIDATION_ERROR"
  }
}
```

### 2. Capture Multiple Leads (Bulk)
**Endpoint:** `POST /leads/bulk`

**Request Body:**
```json
{
  "leads": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    {
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com"
    }
  ]
}
```

**Limits:**
- Maximum 100 leads per request
- Same field requirements as single lead

**Response:**
```json
{
  "success": true,
  "message": "Bulk capture completed. 2 successful, 0 failed.",
  "data": {
    "successful": [
      {
        "lead_id": "uuid-1",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      {
        "lead_id": "uuid-2",
        "email": "jane@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
      }
    ],
    "failed": []
  }
}
```

### 3. Get API Info (Test Connection)
**Endpoint:** `GET /info`

**Response:**
```json
{
  "success": true,
  "data": {
    "client_name": "Homepage Contact Form",
    "rate_limit": 100,
    "default_lead_source": "website",
    "has_custom_field_mapping": false,
    "allowed_origins": ["https://yourwebsite.com"]
  }
}
```

---

## 💡 Integration Examples

### Example 1: HTML Form with JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Contact Us</title>
  <style>
    .form-container { max-width: 500px; margin: 50px auto; }
    .form-group { margin-bottom: 15px; }
    input { width: 100%; padding: 10px; }
    button { background: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; }
    .success { color: green; }
    .error { color: red; }
  </style>
</head>
<body>
  <div class="form-container">
    <h2>Contact Us</h2>
    <form id="contactForm">
      <div class="form-group">
        <input type="text" name="first_name" placeholder="First Name *" required>
      </div>
      <div class="form-group">
        <input type="text" name="last_name" placeholder="Last Name *" required>
      </div>
      <div class="form-group">
        <input type="email" name="email" placeholder="Email *" required>
      </div>
      <div class="form-group">
        <input type="tel" name="phone" placeholder="Phone">
      </div>
      <div class="form-group">
        <input type="text" name="company" placeholder="Company">
      </div>
      <div class="form-group">
        <textarea name="notes" placeholder="Message" rows="4" style="width: 100%; padding: 10px;"></textarea>
      </div>
      <button type="submit">Submit</button>
      <div id="message"></div>
    </form>
  </div>

  <script>
    const API_URL = 'https://yourcrm.com/api/v1/capture/lead';
    const API_KEY = 'ck_your_api_key';
    const API_SECRET = 'your_api_secret';

    document.getElementById('contactForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messageDiv = document.getElementById('message');
      const submitButton = e.target.querySelector('button[type="submit"]');
      
      // Disable submit button
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      
      try {
        // Get form data
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Send to CRM
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'X-API-Secret': API_SECRET
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          messageDiv.className = 'success';
          messageDiv.textContent = '✓ Thank you! We will contact you soon.';
          e.target.reset();
        } else {
          throw new Error(result.error?.message || 'Submission failed');
        }
      } catch (error) {
        messageDiv.className = 'error';
        messageDiv.textContent = '✗ ' + error.message;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    });
  </script>
</body>
</html>
```

### Example 2: React Component

```jsx
import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_CRM_API_URL;
const API_KEY = process.env.REACT_APP_CRM_API_KEY;
const API_SECRET = process.env.REACT_APP_CRM_API_SECRET;

function ContactForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/api/v1/capture/lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          'X-API-Secret': API_SECRET
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({
          type: 'success',
          message: 'Thank you! We will contact you soon.'
        });
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company: '',
          notes: ''
        });
      } else {
        throw new Error(result.error?.message || 'Submission failed');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-form">
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="first_name"
          placeholder="First Name *"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name *"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email *"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="company"
          placeholder="Company"
          value={formData.company}
          onChange={handleChange}
        />
        <textarea
          name="notes"
          placeholder="Message"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {status.message && (
        <div className={`message ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default ContactForm;
```

### Example 3: PHP Backend (Secure)

**⚠️ RECOMMENDED:** For security, API credentials should never be exposed in client-side code. Use a backend proxy instead.

```php
<?php
// api-proxy.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['first_name']) || empty($input['last_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'First name and last name are required']);
        exit;
    }
    
    // Prepare data for CRM
    $leadData = [
        'first_name' => $input['first_name'],
        'last_name' => $input['last_name'],
        'email' => $input['email'] ?? '',
        'phone' => $input['phone'] ?? '',
        'company' => $input['company'] ?? '',
        'job_title' => $input['job_title'] ?? '',
        'notes' => $input['notes'] ?? ''
    ];
    
    // Send to CRM (credentials from environment variables)
    $ch = curl_init('https://yourcrm.com/api/v1/capture/lead');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-API-Key: ' . getenv('CRM_API_KEY'),
        'X-API-Secret: ' . getenv('CRM_API_SECRET')
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leadData));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    echo $response;
}
?>
```

**Frontend (calling PHP proxy):**
```javascript
fetch('/api-proxy.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    alert('Thank you! We will contact you soon.');
  }
});
```

### Example 4: Node.js/Express Backend

```javascript
// server.js
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/api/capture-lead', async (req, res) => {
  try {
    const response = await fetch(`${process.env.CRM_URL}/api/v1/capture/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CRM_API_KEY,
        'X-API-Secret': process.env.CRM_API_SECRET
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## 🎨 Custom Fields

You can capture any additional data using `custom_fields`:

```javascript
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "custom_fields": {
    "budget": "$10,000 - $50,000",
    "timeline": "Q1 2024",
    "interested_in": "Enterprise Plan",
    "company_size": "50-100 employees",
    "hear_about_us": "Google Search",
    "newsletter_signup": true,
    "preferred_contact_method": "email"
  }
}
```

### Custom Field Mapping

Your CRM admin can configure automatic field mapping. For example:
- Your form field `budget` → CRM field `deal_value`
- Your form field `company_name` → CRM field `company`

This is configured in the API client settings.

---

## ⚠️ Error Handling

### Common Error Responses

**400 Bad Request - Missing Required Fields**
```json
{
  "success": false,
  "error": {
    "message": "First name and last name are required",
    "code": "VALIDATION_ERROR"
  }
}
```

**401 Unauthorized - Invalid Credentials**
```json
{
  "success": false,
  "error": {
    "message": "Invalid API credentials",
    "code": "UNAUTHORIZED"
  }
}
```

**429 Too Many Requests - Rate Limit Exceeded**
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  }
}
```

### Handling Errors in Your Code

```javascript
try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-API-Secret': API_SECRET
    },
    body: JSON.stringify(leadData)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    // Handle specific error codes
    switch (result.error?.code) {
      case 'VALIDATION_ERROR':
        console.error('Validation failed:', result.error.message);
        break;
      case 'UNAUTHORIZED':
        console.error('Invalid API credentials');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        console.error('Too many requests, please try again later');
        break;
      default:
        console.error('Unknown error:', result.error.message);
    }
    return;
  }
  
  console.log('Lead captured successfully:', result.data.lead_id);
} catch (error) {
  console.error('Network or server error:', error);
}
```

---

## 🚦 Rate Limits

- **Default:** 100 requests per hour per API client
- **Configurable:** Your admin can increase this limit
- **Tracking:** Rate limit is based on API key
- **Reset:** Resets every hour

**Rate Limit Headers** (coming soon):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

**What happens when exceeded?**
- HTTP Status: `429 Too Many Requests`
- Retry after the hourly reset

---

## ✅ Best Practices

### 1. Security
- **Never** expose API credentials in client-side code
- Use a backend proxy to hide credentials
- Store credentials in environment variables
- Use HTTPS only

### 2. User Experience
- Show loading states during submission
- Display clear success/error messages
- Reset form after successful submission
- Validate form before submission

### 3. Performance
- Implement client-side validation
- Don't submit empty fields
- Use bulk endpoint for multiple leads
- Cache API credentials (don't fetch them for every request)

### 4. Error Handling
- Handle all error codes gracefully
- Provide helpful error messages to users
- Log errors for debugging
- Implement retry logic for network errors

### 5. Data Quality
- Validate email format before submission
- Validate phone format before submission
- Trim whitespace from inputs
- Prevent duplicate submissions

---

## 🧪 Testing

### Test Your Integration

Use this endpoint to verify your API credentials:

```javascript
fetch('https://yourcrm.com/api/v1/capture/info', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your_api_key',
    'X-API-Secret': 'your_api_secret'
  }
})
.then(res => res.json())
.then(data => console.log('API info:', data));
```

### Test Lead Submission

```javascript
fetch('https://yourcrm.com/api/v1/capture/lead', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key',
    'X-API-Secret': 'your_api_secret'
  },
  body: JSON.stringify({
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '+1234567890',
    notes: 'This is a test lead'
  })
})
.then(res => res.json())
.then(data => console.log('Result:', data));
```

### Testing Checklist
- [ ] API credentials are correct
- [ ] API endpoint URL is correct
- [ ] Required fields are being sent
- [ ] Form validation works
- [ ] Success message displays correctly
- [ ] Error messages display correctly
- [ ] Form resets after successful submission
- [ ] Loading state works
- [ ] Network errors are handled
- [ ] Lead appears in CRM

---

## 🔧 Troubleshooting

### Common Issues

**1. "Invalid API credentials" error**
- Verify your API key and secret are correct
- Check for extra spaces or line breaks
- Ensure you're using the correct headers

**2. "CORS error" in browser**
- Ask your admin to add your domain to allowed origins
- Use a backend proxy instead of direct client-side calls
- Check browser console for specific CORS error

**3. "First name and last name are required"**
- Ensure form fields have correct `name` attributes
- Check that values are not empty strings
- Verify data is being sent in request body

**4. "At least one contact method required"**
- Provide either `email` or `phone` (or both)
- Check that at least one has a valid value

**5. Leads not appearing in CRM**
- Check API response for `lead_id`
- Verify you're checking the correct company
- Check lead filters in CRM
- Contact your admin to verify API client status

**6. Rate limit exceeded**
- Wait for hourly reset
- Contact admin to increase rate limit
- Check for infinite loops in your code

### Getting Help

If you're still having issues:

1. **Check the API response** - it usually contains helpful error messages
2. **Test with curl** - eliminates frontend issues
3. **Contact your CRM admin** - they can check logs and settings
4. **Provide details** - include error messages, request body, and response

**Example curl test:**
```bash
curl -X POST https://yourcrm.com/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ck_your_api_key" \
  -H "X-API-Secret: your_api_secret" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com"
  }'
```

---

## 📞 Support

For technical support or questions:
- Contact your CRM administrator
- Email: support@yourcrm.com
- Documentation: https://docs.yourcrm.com

---

## 📝 Changelog

**v1.0.0** (October 2024)
- Initial release
- Single lead capture endpoint
- Bulk lead capture endpoint
- Custom fields support
- Rate limiting
- API client management

---

**Happy integrating! 🎉**

If you have any questions or need help, don't hesitate to reach out to your CRM administrator.

