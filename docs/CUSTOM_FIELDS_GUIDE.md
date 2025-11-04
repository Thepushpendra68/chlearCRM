# 🎨 Custom Fields - Complete Implementation Guide

## ✅ What's Been Implemented

Your CRM now has **FULL SUPPORT** for custom fields from API lead capture! Here's what's working:

### ✨ Features Completed

1. **✅ Automatic Custom Field Display** - All custom fields automatically show when viewing individual leads
2. **✅ Custom Field Mapping UI** - Configure field name mappings in API Clients dashboard
3. **✅ Backend Support** - Complete API support for capturing and storing custom fields
4. **✅ Flexible Storage** - Store ANY custom fields from external forms

---

## 📊 How It Works

### **For Clients (External Form Integration)**

Clients can now send **ANY custom fields** they want via the API:

```php
// In their submit-lead.php
$leadData = array(
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'john@example.com',
    
    // Add ANY custom fields!
    'custom_fields' => array(
        'budget' => '$10,000 - $50,000',
        'timeline' => 'Q1 2024',
        'company_size' => '50-100 employees',
        'interested_in' => 'Enterprise Plan',
        'hear_about_us' => 'Google Ads',
        'newsletter' => true,
        'preferred_contact_time' => '2-4 PM',
        'special_requirements' => 'Need onboarding support'
    )
);
```

**ALL these fields will be automatically saved and displayed!**

---

## 🎯 How to Use - Step by Step

### **Step 1: Create API Client with Custom Field Mapping (Optional)**

1. **Login to CRM Dashboard**
2. **Go to API Clients** (sidebar)
3. **Click "Create API Client"**
4. **Fill in basic details:**
   - Client Name: "Website Contact Form"
   - Rate Limit: 100
   - Allowed Origins: https://yourwebsite.com
   - Default Lead Source: website

5. **Scroll to "Custom Field Mapping" section** (Optional - Advanced)
   
   This is where you can rename fields automatically. For example:
   - If client's form has `company_name` → Map to `company`
   - If client's form has `contact_method` → Map to `preferred_contact`
   
   **Note:** This is OPTIONAL! If you don't configure any mappings, all custom fields will be stored as-is with their original names.

6. **Click "Create API Client"**
7. **Copy and save the credentials**

---

### **Step 2: Client Integrates Their Form**

Share this PHP code with your client:

```php
<?php
// submit-lead.php

$CRM_URL = 'https://your-crm.com';
$API_KEY = 'ck_abc123...';
$API_SECRET = 'secret_xyz789...';

// Capture ALL form data
$leadData = array(
    // Required fields
    'first_name' => trim($_POST['first_name']),
    'last_name' => trim($_POST['last_name']),
    'email' => trim($_POST['email']),
    
    // Optional standard fields
    'phone' => trim($_POST['phone'] ?? ''),
    'company' => trim($_POST['company'] ?? ''),
    'job_title' => trim($_POST['job_title'] ?? ''),
    'notes' => trim($_POST['message'] ?? ''),
    
    // ALL CUSTOM FIELDS - Add as many as needed!
    'custom_fields' => array(
        'budget' => $_POST['budget'] ?? '',
        'timeline' => $_POST['timeline'] ?? '',
        'company_size' => $_POST['company_size'] ?? '',
        'industry' => $_POST['industry'] ?? '',
        'interested_in' => $_POST['interested_in'] ?? '',
        'hear_about_us' => $_POST['hear_about_us'] ?? '',
        'newsletter_signup' => isset($_POST['newsletter']),
        'additional_info' => $_POST['additional_info'] ?? ''
    )
);

// Remove empty custom fields
$leadData['custom_fields'] = array_filter($leadData['custom_fields'], function($value) {
    return $value !== '' && $value !== null;
});

// Send to CRM via cURL
$ch = curl_init($CRM_URL . '/api/v1/capture/lead');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leadData));
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'X-API-Key: ' . $API_KEY,
    'X-API-Secret: ' . $API_SECRET
));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    header('Location: thank-you.html');
} else {
    header('Location: error.html?msg=' . urlencode($response));
}
?>
```

---

### **Step 3: View Custom Fields in CRM**

When a lead is captured:

1. **Go to Leads page**
2. **Click on any lead** to view details
3. **Scroll down** - you'll see a new **"Custom Fields"** section
4. **ALL custom fields** are automatically displayed in a grid layout

**Example of what you'll see:**

```
┌─────────────────────────────────────────┐
│  Custom Fields                  4 fields│
├─────────────────────────────────────────┤
│                                         │
│  BUDGET              TIMELINE           │
│  $10,000 - $50,000   Q1 2024           │
│                                         │
│  COMPANY SIZE        INTERESTED IN      │
│  50-100 employees    Enterprise Plan    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 💡 Real-World Examples

### **Example 1: Real Estate Lead Form**

```html
<form action="submit-lead.php" method="POST">
  <input type="text" name="first_name" required>
  <input type="text" name="last_name" required>
  <input type="email" name="email" required>
  <input type="tel" name="phone">
  
  <!-- Custom fields for real estate -->
  <select name="property_type">
    <option value="house">House</option>
    <option value="apartment">Apartment</option>
    <option value="commercial">Commercial</option>
  </select>
  
  <select name="budget_range">
    <option value="<500k">Under $500k</option>
    <option value="500k-1m">$500k - $1M</option>
    <option value=">1m">Over $1M</option>
  </select>
  
  <input type="text" name="preferred_location">
  <input type="text" name="bedrooms">
  <input type="text" name="move_in_date">
  
  <button type="submit">Submit</button>
</form>
```

**PHP Handler:**
```php
'custom_fields' => array(
    'property_type' => $_POST['property_type'] ?? '',
    'budget_range' => $_POST['budget_range'] ?? '',
    'preferred_location' => $_POST['preferred_location'] ?? '',
    'bedrooms' => $_POST['bedrooms'] ?? '',
    'move_in_date' => $_POST['move_in_date'] ?? ''
)
```

**✅ All fields automatically appear in lead details!**

---

### **Example 2: SaaS Product Lead Form**

```html
<form>
  <!-- Standard fields -->
  <input type="text" name="first_name" required>
  <input type="text" name="last_name" required>
  <input type="email" name="email" required>
  
  <!-- Custom SaaS fields -->
  <select name="company_size">
    <option value="1-10">1-10 employees</option>
    <option value="11-50">11-50 employees</option>
    <option value="51-200">51-200 employees</option>
    <option value=">200">200+ employees</option>
  </select>
  
  <select name="interested_plan">
    <option value="starter">Starter</option>
    <option value="professional">Professional</option>
    <option value="enterprise">Enterprise</option>
  </select>
  
  <input type="text" name="current_solution" placeholder="Current tool you're using">
  <input type="text" name="monthly_budget" placeholder="Monthly budget">
  <input type="text" name="team_size" placeholder="Team size">
  
  <label>
    <input type="checkbox" name="demo_requested" value="yes">
    Request a demo
  </label>
  
  <button type="submit">Get Started</button>
</form>
```

**PHP Handler:**
```php
'custom_fields' => array(
    'company_size' => $_POST['company_size'] ?? '',
    'interested_plan' => $_POST['interested_plan'] ?? '',
    'current_solution' => $_POST['current_solution'] ?? '',
    'monthly_budget' => $_POST['monthly_budget'] ?? '',
    'team_size' => $_POST['team_size'] ?? '',
    'demo_requested' => isset($_POST['demo_requested']),
    'form_version' => '2.0',
    'landing_page' => 'pricing-page'
)
```

---

### **Example 3: Service Business Lead Form**

```php
// Consulting/Service business custom fields
'custom_fields' => array(
    'service_interested' => $_POST['service_type'] ?? '',
    'project_scope' => $_POST['project_scope'] ?? '',
    'timeline' => $_POST['timeline'] ?? '',
    'budget' => $_POST['budget'] ?? '',
    'current_pain_points' => $_POST['challenges'] ?? '',
    'referral_source' => $_POST['how_heard'] ?? '',
    'urgency_level' => $_POST['urgency'] ?? '',
    'previous_vendor' => $_POST['previous_vendor'] ?? '',
    'team_size' => $_POST['team_size'] ?? '',
    'industry' => $_POST['industry'] ?? ''
)
```

---

## 🎨 UI Features

### **Custom Fields Section Appearance**

The Custom Fields section will automatically:

✅ **Only show if custom fields exist** - Won't clutter the UI for leads without custom fields  
✅ **Display field count badge** - Shows "5 fields" so you know how many custom fields exist  
✅ **Format field names nicely** - Converts `company_size` to "Company Size"  
✅ **Handle different data types:**
   - Booleans: Display as "Yes" or "No"
   - Objects: Display as JSON
   - Null/undefined: Display as "N/A"
   - Strings/Numbers: Display as-is

✅ **Responsive grid layout** - 2 columns on desktop, 1 column on mobile  
✅ **Proper word wrapping** - Long values don't break the layout

---

## 🔧 Technical Details

### **Database Storage**

Custom fields are stored in the `leads` table in a `custom_fields` JSONB column:

```sql
-- Example stored data
{
  "budget": "$10,000 - $50,000",
  "timeline": "Q1 2024",
  "company_size": "50-100 employees",
  "interested_in": "Enterprise Plan",
  "newsletter_signup": true
}
```

### **Querying Custom Fields**

You can query leads by custom fields:

```sql
-- Find leads with specific custom field value
SELECT *
FROM leads
WHERE custom_fields->>'budget' = '$10,000 - $50,000';

-- Find leads that have a specific custom field
SELECT *
FROM leads
WHERE custom_fields ? 'timeline';

-- Count leads by custom field value
SELECT 
  custom_fields->>'company_size' as size,
  COUNT(*) as count
FROM leads
WHERE custom_fields ? 'company_size'
GROUP BY custom_fields->>'company_size';
```

---

## 📝 Field Mapping Examples

### **Scenario 1: Different Field Names**

**Client's form uses:**
- `company_name` → CRM expects `company`
- `contact_phone` → CRM expects `phone`
- `budget_range` → You want it in custom_fields as `budget`

**Configuration in API Clients:**
```
company_name → company
contact_phone → phone
```

**Result:**
- `company_name` value goes to standard `company` field
- `contact_phone` value goes to standard `phone` field
- `budget_range` stays in custom_fields as-is

---

### **Scenario 2: No Mapping Needed**

If the client uses standard field names, leave mapping empty!

**Client sends:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "custom_fields": {
    "budget": "$50k",
    "timeline": "Q1"
  }
}
```

**Stored exactly as-is** - no mapping needed! ✅

---

## 🎯 Best Practices

### **For CRM Admins:**

1. ✅ **Keep field mappings simple** - Only map when absolutely necessary
2. ✅ **Document your mappings** - Keep a note of which API client uses which mappings
3. ✅ **Test with sample data** - Have client send test lead first
4. ✅ **Monitor custom fields** - Check what fields clients are sending regularly

### **For Clients:**

1. ✅ **Use descriptive field names** - `budget` is better than `field1`
2. ✅ **Be consistent** - Use same field names across all forms
3. ✅ **Remove empty fields** - Don't send fields with empty values
4. ✅ **Use proper data types** - Boolean for yes/no, numbers for numeric values

---

## 📊 Monitoring Custom Fields

### **Check What Fields Are Being Captured**

```sql
-- Get all unique custom field keys
SELECT DISTINCT jsonb_object_keys(custom_fields) as field_name
FROM leads
WHERE custom_fields IS NOT NULL
  AND custom_fields != '{}'::jsonb
ORDER BY field_name;

-- Get most common custom field values
SELECT 
  custom_fields->>'budget' as budget_value,
  COUNT(*) as lead_count
FROM leads
WHERE custom_fields ? 'budget'
GROUP BY custom_fields->>'budget'
ORDER BY lead_count DESC;
```

---

## 🚀 What's Next?

### **Already Working:**
- ✅ Custom fields automatically display
- ✅ Field mapping configuration in dashboard
- ✅ Full API support
- ✅ JSONB storage for flexibility
- ✅ Responsive UI

### **Future Enhancements (Optional):**
- 📝 Edit custom fields in lead edit form
- 📊 Filter leads by custom field values
- 📈 Analytics/reports on custom fields
- 🎨 Define custom field types (dropdown, date, etc.)
- 🔍 Search leads by custom field values

---

## 🎉 Summary

**Custom fields are now FULLY FUNCTIONAL!**

✅ Clients can send ANY custom fields via API  
✅ All custom fields are automatically stored  
✅ All custom fields automatically display in lead details  
✅ Field mapping available for advanced scenarios  
✅ No configuration required for basic use

**Tell your clients:** "Add any fields you want to `custom_fields` in your API request - they'll all be captured and visible in the CRM!"

---

## 📞 Support

If you need help:
1. Check this guide first
2. Review the API integration guide: `docs/lead-capture-api-integration-guide.md`
3. Test with sample data before going live
4. Contact your CRM administrator

---

**Last Updated:** October 2024  
**Version:** 1.0.0


