# Public Lead Capture Form - Setup Guide

This guide will help you set up and use the public lead capture form that integrates with your API client and displays leads in your CRM dashboard.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Step-by-Step Setup](#step-by-step-setup)
3. [Configuring Custom Fields](#configuring-custom-fields)
4. [Testing the Form](#testing-the-form)
5. [Viewing Captured Leads](#viewing-captured-leads)
6. [Embedding on External Websites](#embedding-on-external-websites)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

1. Create an API client in your CRM
2. Copy the API Key and Secret
3. Update the form configuration
4. Access the form at `http://localhost:5173/lead-form`
5. Leads will appear in your dashboard

---

## 📝 Step-by-Step Setup

### Step 1: Create an API Client

1. Log in to your CRM dashboard
2. Navigate to **Settings** → **API Clients** (or go to `/app/api-clients`)
3. Click **"Create API Client"**
4. Fill in the form:
   - **Client Name**: "Website Contact Form" (or any descriptive name)
   - **Rate Limit**: 100 (requests per hour)
   - **Allowed Origins**: `http://localhost:5173, https://yourdomain.com` (comma-separated)
   - **Default Lead Source**: "website" or "api"
   - **Webhook URL**: (optional) Leave blank for now
5. Click **"Create API Client"**

### Step 2: Save Your Credentials

⚠️ **IMPORTANT**: The API Secret is shown only once!

After creating the API client, you'll see a modal with:
- **Client Name**: Your chosen name
- **API Key**: Starts with `ck_` (e.g., `ck_abc123...`)
- **API Secret**: Starts with `sk_` (e.g., `sk_xyz789...`)

**Copy both credentials immediately** and save them securely.

### Step 3: Configure the Form

Open the file: `frontend/src/pages/PublicLeadForm.jsx`

Find this section near the top of the component:

```javascript
const [apiConfig] = useState({
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  apiKey: '', // Get from API Clients tab
  apiSecret: '' // Get from API Clients tab (shown only once during creation)
});
```

Replace the empty strings with your credentials:

```javascript
const [apiConfig] = useState({
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  apiKey: 'ck_your_actual_api_key_here',
  apiSecret: 'sk_your_actual_secret_here'
});
```

**Security Note**: For production, consider:
- Using environment variables instead of hardcoded values
- Implementing a backend proxy to hide credentials
- Setting up proper CORS policies

---

## 🎨 Configuring Custom Fields

The form includes two custom fields by default:
1. **Source** - A dropdown select field
2. **Lead Source** - A text input field

### Verifying Custom Fields in Your CRM

1. Go to **Settings** → **Custom Fields** (`/app/custom-fields`)
2. Click **"Create Custom Field"**
3. Create the following fields if they don't exist:

#### Field 1: Source
- **Field Name**: `source`
- **Field Label**: "Source"
- **Entity Type**: Lead
- **Data Type**: Select (Dropdown)
- **Options**: `website, social_media, referral, advertisement, event, other`
- **Required**: No
- **Active**: Yes

#### Field 2: Lead Source
- **Field Name**: `lead_source`
- **Field Label**: "Lead Source"
- **Entity Type**: Lead
- **Data Type**: Text
- **Required**: No
- **Active**: Yes

### Adding More Custom Fields

To add more custom fields to the form:

1. **Create the field definition** in Custom Fields page
2. **Update the form state** in `PublicLeadForm.jsx`:
   ```javascript
   const [formData, setFormData] = useState({
     // ... existing fields ...
     your_new_field: '', // Add your new field here
   });
   ```
3. **Add the form input** in the JSX:
   ```jsx
   <div>
     <label htmlFor="your_new_field">Your New Field</label>
     <input
       type="text"
       id="your_new_field"
       name="your_new_field"
       value={formData.your_new_field}
       onChange={handleChange}
       className="block w-full px-3 py-3 border border-gray-300 rounded-lg"
     />
   </div>
   ```
4. **Include in custom fields** when submitting:
   ```javascript
   const customFields = {};
   if (formData.source) customFields.source = formData.source;
   if (formData.lead_source) customFields.lead_source = formData.lead_source;
   if (formData.your_new_field) customFields.your_new_field = formData.your_new_field;
   ```

---

## 🧪 Testing the Form

### Local Testing

1. Make sure your backend is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Make sure your frontend is running:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and go to:
   ```
   http://localhost:5173/lead-form
   ```

4. Fill out the form with test data:
   - **First Name**: John
   - **Last Name**: Doe
   - **Email**: john.doe@example.com
   - **Phone**: +1 (555) 123-4567
   - **Company**: Test Company
   - **Job Title**: Marketing Manager
   - **Source**: Website
   - **Lead Source**: Homepage Form
   - **Message**: This is a test submission

5. Click **"Submit"**

6. You should see a success message: "Thank you! Your information has been submitted successfully."

### Verifying API Call

Open your browser's Developer Tools (F12):

1. Go to the **Network** tab
2. Submit the form
3. Look for a request to `/v1/capture/lead`
4. Check the request headers:
   - `X-API-Key`: Should contain your API key
   - `X-API-Secret`: Should contain your API secret
5. Check the response:
   - Status: `201 Created`
   - Body: Should show the created lead data

---

## 👀 Viewing Captured Leads

### In the Dashboard

1. Log in to your CRM
2. Navigate to **Leads** (`/app/leads`)
3. You should see the newly captured lead at the top of the list
4. Click on the lead to view details

### Lead Information

The captured lead will include:
- **Name**: First and Last name from the form
- **Email**: Contact email
- **Phone**: Contact phone number
- **Company**: Company name
- **Job Title**: Job title
- **Status**: "new" (default)
- **Source**: From the "source" custom field
- **Lead Source**: From the "lead_source" custom field
- **Notes**: Message from the form
- **Created By**: Will show as "API" (since it's API-generated)
- **Assigned To**: Based on your API client's default assignment settings

### Custom Fields Display

To see custom fields on the lead detail page:
1. Go to **Leads** → Click on a lead
2. Scroll to the **Custom Fields** section
3. You should see:
   - **Source**: The value selected in the form
   - **Lead Source**: The text entered in the form

---

## 🌐 Embedding on External Websites

### Option 1: Iframe Embed (Easiest)

Once you deploy your frontend, you can embed the form using an iframe:

```html
<iframe 
  src="https://your-crm-domain.com/lead-form" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="max-width: 800px; margin: 0 auto;">
</iframe>
```

### Option 2: Direct Integration

For better customization, copy the form component to your external website:

1. Copy `PublicLeadForm.jsx` to your project
2. Install required dependencies:
   ```bash
   npm install axios @heroicons/react
   ```
3. Import and use the component:
   ```javascript
   import PublicLeadForm from './components/PublicLeadForm';
   
   function ContactPage() {
     return <PublicLeadForm />;
   }
   ```

### Option 3: API Integration

Build your own custom form and submit directly to the API:

```javascript
const submitLead = async (formData) => {
  try {
    const response = await fetch('https://your-api-domain.com/api/v1/capture/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your_api_key',
        'X-API-Secret': 'your_api_secret'
      },
      body: JSON.stringify({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        job_title: formData.jobTitle,
        notes: formData.message,
        custom_fields: {
          source: formData.source,
          lead_source: formData.leadSource
        }
      })
    });
    
    const data = await response.json();
    console.log('Lead created:', data);
  } catch (error) {
    console.error('Error submitting lead:', error);
  }
};
```

### CORS Configuration

Make sure your API client has the correct allowed origins:

1. Go to **API Clients** in your CRM
2. Edit your API client
3. Add your website domain to **Allowed Origins**:
   ```
   https://www.yourwebsite.com, https://yourwebsite.com
   ```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "API credentials are not configured" Message

**Problem**: The form shows a yellow alert about missing API credentials.

**Solution**: 
- Open `frontend/src/pages/PublicLeadForm.jsx`
- Update the `apiConfig` object with your actual API key and secret
- Save the file and refresh the browser

#### 2. CORS Errors

**Problem**: Browser console shows CORS policy errors.

**Solution**:
- Go to **API Clients** in your CRM
- Edit the API client
- Add your domain to **Allowed Origins**
- Format: `http://localhost:5173` (no trailing slash)

#### 3. 401 Unauthorized Error

**Problem**: Form submission fails with 401 error.

**Solution**:
- Verify your API key and secret are correct
- Check that they're properly copied (no extra spaces)
- Ensure the API client is **Active** in the CRM

#### 4. 403 Forbidden Error

**Problem**: API returns 403 error.

**Solution**:
- Check **Allowed Origins** in API client settings
- Verify the origin matches exactly (including http/https)
- Try adding both www and non-www versions

#### 5. Custom Fields Not Showing

**Problem**: Custom fields don't appear in the lead details.

**Solution**:
- Go to **Custom Fields** in CRM
- Verify the fields exist with correct names (`source`, `lead_source`)
- Ensure **Entity Type** is set to "Lead"
- Make sure fields are **Active**

#### 6. Leads Not Appearing in Dashboard

**Problem**: Form submits successfully but leads don't show up.

**Solution**:
- Check the API response in browser Developer Tools
- Verify the lead was created (should return 201 status)
- Refresh the Leads page
- Check if you're filtering leads (clear filters)
- Verify you're logged in with the correct company account

### Getting Help

If you encounter issues not covered here:

1. Check browser console for errors (F12 → Console)
2. Check backend logs for API errors
3. Verify all environment variables are set correctly
4. Test the API directly using Postman or curl

---

## 📊 Best Practices

### Security
- Never commit API secrets to version control
- Use environment variables for production
- Implement rate limiting
- Monitor API usage regularly

### User Experience
- Keep forms short and simple
- Make only essential fields required
- Provide clear error messages
- Show success confirmation
- Consider adding reCAPTCHA to prevent spam

### Data Quality
- Validate email addresses
- Format phone numbers consistently
- Use dropdown menus for standardized data
- Provide helpful placeholder text
- Add field descriptions where needed

---

## 🎯 Next Steps

Once your form is working:

1. **Customize the styling** to match your brand
2. **Add validation** for better data quality
3. **Set up email notifications** when leads are captured
4. **Create automated workflows** for lead follow-up
5. **Add analytics tracking** to measure form performance
6. **Implement A/B testing** to optimize conversions

---

## 📞 Support

For questions or issues:
- Check the troubleshooting section above
- Review API documentation
- Contact your CRM administrator

---

**Last Updated**: October 30, 2025
**Version**: 1.0.0

