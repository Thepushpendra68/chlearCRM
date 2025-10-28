# ⚡ Lead Capture API - Quick Start Guide

## 🎯 What You Need

✅ **API URL**: `https://your-crm-url.com`  
✅ **API Key**: `ck_abc123...` (starts with `ck_`)  
✅ **API Secret**: `secret_xyz789...` (long random string)  

> 🔒 **Important**: Keep these credentials secure! Never commit to Git or expose in client-side code.

---

## 🚀 3-Minute Setup

### Step 1: Copy This Code

```html
<form id="leadForm">
  <input type="text" name="first_name" placeholder="First Name" required>
  <input type="text" name="last_name" placeholder="Last Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <input type="tel" name="phone" placeholder="Phone">
  <button type="submit">Submit</button>
</form>

<script>
const API_URL = 'YOUR_CRM_URL/api/v1/capture/lead';
const API_KEY = 'YOUR_API_KEY';
const API_SECRET = 'YOUR_API_SECRET';

document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert('Thank you! We will contact you soon.');
      e.target.reset();
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});
</script>
```

### Step 2: Replace These Values

- Replace `YOUR_CRM_URL` with your CRM URL (e.g., `https://crm.example.com`)
- Replace `YOUR_API_KEY` with your API key (e.g., `ck_abc123...`)
- Replace `YOUR_API_SECRET` with your API secret

### Step 3: Test It!

Open the page, fill the form, and click submit. Check your CRM - the lead should appear instantly!

---

## 📋 Required Fields

You **MUST** include:
- ✅ `first_name`
- ✅ `last_name`
- ✅ `email` OR `phone` (at least one)

## 🎨 Optional Fields

You **CAN** include:
- `company` - Company name
- `job_title` - Job title
- `phone` - Phone number
- `notes` - Any message/notes
- `custom_fields` - Any additional data (see below)

---

## 🔧 Custom Fields Example

Want to capture more data? Use `custom_fields`:

```javascript
const data = {
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  custom_fields: {
    budget: "$50,000",
    timeline: "Q1 2024",
    company_size: "50-100",
    interested_in: "Enterprise Plan"
  }
};
```

All custom fields will be saved in your CRM!

---

## ✅ Test Your Integration

Use this to test if your credentials work:

```bash
curl -X GET "YOUR_CRM_URL/api/v1/capture/info" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-API-Secret: YOUR_API_SECRET"
```

If successful, you'll see your API client info!

---

## 🐛 Common Issues

### "Invalid API credentials"
- ❌ Check for typos in API key/secret
- ❌ Check for extra spaces
- ❌ Verify credentials haven't been regenerated

### "First name and last name are required"
- ❌ Make sure form fields have correct `name` attributes
- ❌ Check values aren't empty

### "At least one contact method required"
- ❌ Provide `email` or `phone` (or both)

### CORS Error
- ❌ Contact your CRM admin to add your domain to allowed origins
- ❌ Or use a backend proxy (recommended)

---

## 🔒 Security Tip

**❌ DON'T** expose credentials like this:
```html
<!-- BAD - credentials visible to everyone -->
<script>
const API_KEY = 'ck_abc123...';
const API_SECRET = 'secret_xyz789...';
</script>
```

**✅ DO** use a backend proxy:
```javascript
// GOOD - credentials hidden on server
fetch('/api/submit-lead', {
  method: 'POST',
  body: JSON.stringify(data)
});

// Your backend then forwards to CRM with credentials
```

---

## 📚 Full Documentation

Need more details? Check out:
- **Complete Integration Guide**: Full documentation with examples
- **Advanced Examples**: Forms with validation, multi-step, etc.
- **API Reference**: All endpoints and options

Contact your CRM administrator for these documents.

---

## 📞 Need Help?

1. **Test with curl first** - helps identify the issue
2. **Check browser console** - for JavaScript errors
3. **Verify credentials** - make sure they're correct
4. **Contact your CRM admin** - they can check logs

---

## 🎉 You're Done!

Your form is now connected to the CRM. Every submission will automatically create a lead!

**What happens next?**
- Lead appears instantly in CRM
- Sales team gets notified
- Lead gets auto-assigned (if configured)
- You can track all submissions in CRM

---

**Happy integrating! 🚀**

