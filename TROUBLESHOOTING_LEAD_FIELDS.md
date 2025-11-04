# 🔍 Troubleshooting: Lead Fields Not Showing

## ✅ Good News!

Your Lead Detail page **ALREADY SUPPORTS custom fields** and displays all standard fields. The code is in place and working correctly:

- **File:** `frontend/src/pages/LeadDetail.jsx`
- **Custom Fields Section:** Lines 436-476
- **All Standard Fields:** Email, Phone, Company, Job Title, Lead Source, Status, Priority, etc.

---

## 📋 Fields That Should Be Visible

### Contact Information Card
- ✅ Email
- ✅ Phone
- ✅ Company
- ✅ Job Title

### Lead Details Card
- ✅ Lead Source
- ✅ Status  
- ✅ Priority

### Pipeline & Deal Information Card
- ✅ Pipeline Stage
- ✅ Deal Value
- ✅ Probability
- ✅ Expected Close Date

### Notes Section
- ✅ Notes/Message

### Custom Fields Card
- ✅ Source (your custom field)
- ✅ Lead Source (your custom field)
- ✅ Any other custom fields

### Sidebar
- ✅ Lead ID
- ✅ Created Date
- ✅ Updated Date
- ✅ Assigned To
- ✅ Assignment Method
- ✅ Created By
- ✅ Record Age

---

## 🐛 Why Custom Fields Might Not Show

The custom fields section only displays if:

1. **`lead.custom_fields`** exists
2. **`lead.custom_fields`** is not empty (has at least one field)

If you don't see the "Custom Fields" section, it means the lead doesn't have any custom field data.

---

## 🧪 How to Test & Debug

### Step 1: Submit a Test Lead

1. Go to: `http://localhost:5173/lead-form`
2. Fill out the form including:
   - **Source**: Select "Website" from dropdown
   - **Lead Source**: Type "Test Form"
3. Click Submit
4. Wait for success message

### Step 2: Check if Lead Was Created

1. Go to your CRM: `http://localhost:5173/app/leads`
2. Look for the test lead at the top of the list
3. Click on the lead to open details

### Step 3: Verify Custom Fields

**Expected Result:**
You should see a section called "Custom Fields" with:
- **Source**: Website
- **Lead Source**: Test Form

**If you DON'T see the Custom Fields section:**

The lead was created but `custom_fields` is empty. Let's debug!

---

## 🔧 Debugging Steps

### Debug 1: Check Browser Console

1. Open the lead detail page
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Type: `console.log(lead)` (if there are errors)
5. Look for the lead object and check if `custom_fields` property exists

### Debug 2: Check Network Request

1. Open the lead detail page
2. Press **F12** → **Network** tab
3. Refresh the page
4. Find the request to `/api/leads/{id}`
5. Click on it → **Response** tab
6. Look for the `custom_fields` property in the response

**Example of what you should see:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "custom_fields": {
      "source": "website",
      "lead_source": "Test Form"
    }
  }
}
```

### Debug 3: Check Form Submission

1. Open: `http://localhost:5173/lead-form`
2. Press **F12** → **Network** tab
3. Fill out the form with custom fields
4. Click Submit
5. Find the request to `/api/v1/capture/lead`
6. Click on it → **Payload** or **Request** tab
7. Verify the payload includes:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "custom_fields": {
    "source": "website",
    "lead_source": "Test Form"
  }
}
```

### Debug 4: Check Backend Logs

1. Look at your backend terminal/console
2. When you submit the form, you should see logs
3. Look for any errors related to custom fields
4. Check for validation errors

---

##  Common Issues & Solutions

### Issue 1: Custom Fields Section Not Visible

**Symptom:** The "Custom Fields" card doesn't appear at all

**Causes:**
- Lead has no custom fields data
- `custom_fields` is `null` or `{}`
- Custom fields weren't submitted with the form

**Solution:**
1. Make sure you're filling out the "Source" and "Lead Source" fields in the form
2. Check the network request payload (Debug 3 above)
3. Verify the custom field definitions exist in CRM → Custom Fields

### Issue 2: Custom Field Definitions Don't Exist

**Symptom:** Form submits but fields aren't saved

**Solution:**
1. Go to: `http://localhost:5173/app/custom-fields`
2. Create the custom fields:

**Field 1:**
```
Field Name: source
Entity Type: Lead
Data Type: Select
Options: website, social_media, referral, advertisement, event, other
```

**Field 2:**
```
Field Name: lead_source
Entity Type: Lead
Data Type: Text
```

3. Make sure both are **Active**

### Issue 3: Some Standard Fields Not Showing

**Symptom:** Phone, Company, or Job Title don't show

**Cause:** These fields only display if they have data

**Solution:**
The Lead Detail page only shows optional fields if they contain data:
- **Phone** - Only shows if `lead.phone` has a value
- **Company** - Only shows if `lead.company` has a value
- **Job Title** - Only shows if `lead.job_title` has a value
- **Notes** - Only shows if `lead.notes` has a value

This is by design to keep the UI clean. Fill them out in the form to see them!

### Issue 4: Deal Value / Pipeline Info Not Showing

**Symptom:** Deal value shows "No value set"

**Cause:** These fields are optional business fields

**Solution:**
- Click **Edit** on the lead detail page
- Fill in: Deal Value, Probability, Expected Close Date
- Save the lead
- These fields will now display

---

## 🎯 Quick Verification Checklist

Run through this checklist:

- [ ] Backend server is running (`cd backend && npm run dev`)
- [ ] Frontend server is running (`cd frontend && npm run dev`)
- [ ] Custom field definitions exist in database (check Custom Fields page)
- [ ] Form credentials are configured (`PublicLeadForm.jsx`)
- [ ] Form includes Source and Lead Source fields
- [ ] Test submission shows success message
- [ ] Lead appears in Leads list
- [ ] Can click on lead to open detail page
- [ ] All contact info displays (email, phone if provided, etc.)
- [ ] Custom Fields section appears with data

---

## 📊 Expected vs. Actual

### When Form is Fully Filled Out:

| Field | Should Display? | Location |
|-------|----------------|----------|
| First Name | ✅ Always | Header |
| Last Name | ✅ Always | Header |
| Email | ✅ Always | Contact Information |
| Phone | ✅ If provided | Contact Information |
| Company | ✅ If provided | Contact Information |
| Job Title | ✅ If provided | Contact Information |
| Status | ✅ Always | Lead Details |
| Lead Source | ✅ Always | Lead Details |
| Priority | ✅ Always | Lead Details |
| **Source** (Custom) | ✅ If provided | Custom Fields Card |
| **Lead Source** (Custom) | ✅ If provided | Custom Fields Card |
| Notes | ✅ If provided | Notes Section |
| Created Date | ✅ Always | Sidebar |
| Assigned To | ✅ If assigned | Sidebar |

---

## 🔍 Live Debugging Script

Add this to the Lead Detail page temporarily to debug:

1. Open `frontend/src/pages/LeadDetail.jsx`
2. Add after line 57 (in `fetchLead` function):

```javascript
const fetchLead = async () => {
  try {
    setLoading(true)
    const response = await leadService.getLeadById(id)
    setLead(response.data)
    
    // DEBUG: Log the lead data
    console.log('🔍 Lead Data:', response.data);
    console.log('📋 Custom Fields:', response.data.custom_fields);
    console.log('📊 Custom Fields Keys:', response.data.custom_fields ? Object.keys(response.data.custom_fields) : 'No custom fields');
    
  } catch (error) {
    // ... rest of code
```

3. Refresh the lead detail page
4. Open Console (F12)
5. Check what's logged

This will show you exactly what data is being received!

---

## ✅ If Everything is Working

If custom fields ARE showing correctly, but you want to add MORE fields:

### Add a New Custom Field:

1. **Create the definition:**
   - Go to Custom Fields page
   - Click "Create Custom Field"
   - Fill in the details

2. **Update the form:**
   - Open `PublicLeadForm.jsx`
   - Add your new field to the form
   - Include it in the `customFields` object

3. **Test:**
   - Submit form with new field
   - Check lead detail page
   - New field should appear in Custom Fields section

---

## 🆘 Still Having Issues?

If fields still aren't showing after following this guide:

1. **Check the console** for JavaScript errors
2. **Check the network tab** for API errors  
3. **Check backend logs** for server errors
4. **Verify database** has the custom field definitions
5. **Test with curl** or Postman to verify API works

### Manual API Test:

```bash
# Test creating a lead with custom fields
curl -X POST http://localhost:5000/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -H "X-API-Secret: your_api_secret" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "custom_fields": {
      "source": "website",
      "lead_source": "Manual Test"
    }
  }'
```

Then check if the lead was created with custom fields in the database.

---

## 📞 Summary

**Your Lead Detail page is fully functional and supports:**
- ✅ All standard lead fields
- ✅ Custom fields (when they exist)
- ✅ Dynamic display (only shows fields with data)
- ✅ Clean, organized UI

**If custom fields aren't showing:**
1. Verify they're being submitted from the form
2. Check the API response includes `custom_fields`
3. Ensure custom field definitions exist
4. Use the debugging steps above

**Everything is working correctly in the code!** The issue is likely with data not being saved or custom field definitions not existing.

---

**Last Updated:** October 30, 2025  
**Status:** Lead Detail page is fully functional  
**Action:** Follow debugging steps above to verify data flow

