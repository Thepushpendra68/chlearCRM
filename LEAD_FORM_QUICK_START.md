# 🚀 Lead Capture Form - Quick Start

Your public lead capture form is ready! Here's everything you need to get started.

## ✅ What Was Created

1. **Public Lead Form Component** (`frontend/src/pages/PublicLeadForm.jsx`)
   - Beautiful, responsive form with validation
   - Integrates with your API client
   - Includes custom fields: "source" and "lead_source"
   - Shows success/error messages

2. **Route Added** (`/lead-form`)
   - Publicly accessible (no login required)
   - Can be accessed at: `http://localhost:5173/lead-form`

3. **Setup Guide** (`LEAD_FORM_SETUP_GUIDE.md`)
   - Complete documentation
   - Step-by-step instructions
   - Troubleshooting tips

4. **HTML Example** (`frontend/public/lead-form-example.html`)
   - Standalone HTML form
   - Easy to embed on any website
   - No React/framework required

## 🎯 Quick Setup (3 Steps)

### Step 1: Create API Client

1. Go to your CRM dashboard → **API Clients** tab
2. Click **"Create API Client"**
3. Fill in the details:
   ```
   Client Name: Website Contact Form
   Rate Limit: 100
   Allowed Origins: http://localhost:5173
   Default Lead Source: website
   ```
4. Click **"Create"** and **SAVE YOUR CREDENTIALS**:
   - API Key (starts with `ck_`)
   - API Secret (starts with `sk_`) ⚠️ **Shown only once!**

### Step 2: Configure the Form

Open `frontend/src/pages/PublicLeadForm.jsx` and update line 20-24:

```javascript
const [apiConfig] = useState({
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  apiKey: 'ck_your_actual_key_here',      // ← Paste your API key
  apiSecret: 'sk_your_actual_secret_here' // ← Paste your API secret
});
```

### Step 3: Create Custom Fields

Go to **Custom Fields** tab in your CRM and create:

**Field 1:**
- Field Name: `source`
- Entity Type: Lead
- Data Type: Select
- Options: `website, social_media, referral, advertisement, event, other`

**Field 2:**
- Field Name: `lead_source`
- Entity Type: Lead
- Data Type: Text

## 🧪 Test It Now!

1. Make sure backend is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Make sure frontend is running:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open in browser:
   ```
   http://localhost:5173/lead-form
   ```

4. Fill out the form and submit

5. Check your dashboard:
   - Go to **Leads** tab
   - Your test lead should appear at the top!

## 📊 How It Works

```
User fills form → Submits → API validates → Creates lead → Shows in dashboard
                     ↓
              Uses API Client credentials
                     ↓
              Includes custom fields (source, lead_source)
```

## 🎨 Form Fields

### Required Fields:
- ✅ First Name
- ✅ Last Name  
- ✅ Email Address

### Optional Fields:
- Phone Number
- Company
- Job Title
- Source (dropdown)
- Lead Source (text)
- Message/Notes

## 📍 Where to Find Everything

| What | Where |
|------|-------|
| **Form Component** | `frontend/src/pages/PublicLeadForm.jsx` |
| **Form Route** | `http://localhost:5173/lead-form` |
| **API Clients Management** | CRM → Settings → API Clients |
| **Custom Fields Management** | CRM → Settings → Custom Fields |
| **View Captured Leads** | CRM → Leads |
| **Full Documentation** | `LEAD_FORM_SETUP_GUIDE.md` |
| **HTML Example** | `frontend/public/lead-form-example.html` |

## 🌐 Use Cases

### 1. Internal Form (Current Setup)
- Hosted on your CRM domain
- Access at `/lead-form`
- Perfect for testing and internal use

### 2. External Website (Iframe)
```html
<iframe 
  src="https://your-crm.com/lead-form" 
  width="100%" 
  height="800px">
</iframe>
```

### 3. Standalone Page
- Use the `lead-form-example.html` file
- Upload to any web host
- No framework required

### 4. Custom Integration
- Build your own form
- Submit directly to API endpoint
- Full control over design

## 🔧 Common Issues & Solutions

### ⚠️ "API credentials are not configured"
**Fix:** Update `apiKey` and `apiSecret` in `PublicLeadForm.jsx`

### ⚠️ CORS Error
**Fix:** Add your domain to "Allowed Origins" in API Client settings

### ⚠️ 401 Unauthorized
**Fix:** Double-check your API credentials are correct

### ⚠️ Lead not showing in dashboard
**Fix:** Refresh the Leads page, check filters, verify API response

## 🎉 Next Steps

Once everything is working:

1. ✅ **Customize the design** to match your brand
2. ✅ **Add more custom fields** as needed
3. ✅ **Set up email notifications** for new leads
4. ✅ **Create lead assignment rules** for automatic routing
5. ✅ **Deploy to production** and update API URLs
6. ✅ **Monitor lead capture** in API Client statistics

## 📞 Need Help?

- 📖 Read the full guide: `LEAD_FORM_SETUP_GUIDE.md`
- 🔍 Check browser console for errors (F12)
- 📊 View API Client statistics in your CRM
- 🧪 Use the HTML example for testing

---

**Ready to go!** 🚀 Your lead capture form is fully integrated with your CRM. Any leads submitted through this form will automatically appear in your dashboard with all the custom fields you configured.

Happy lead capturing! 🎯

