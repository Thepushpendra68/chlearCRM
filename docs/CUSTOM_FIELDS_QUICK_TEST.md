# 🧪 Custom Fields - Quick Testing Guide

## ✅ What Was Done

Custom field support has been added to your CRM! Here's a quick guide to test it.

---

## 🚀 Quick Test (5 Minutes)

### **Step 1: Start Your CRM**

```bash
# In project root
cd backend
npm run dev

# In another terminal
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

---

### **Step 2: Create API Client**

1. **Login to CRM**
2. **Go to "API Clients"** (sidebar)
3. **Click "Create API Client"**
4. **Fill in:**
   - Client Name: `Test Form`
   - Rate Limit: `100`
   - Allowed Origins: `http://localhost:8000`
   - Default Lead Source: `test`
5. **(Optional) Add Field Mapping:**
   - Click "+ Add Field Mapping"
   - Source: `company_name` → Target: `company`
6. **Click "Create API Client"**
7. **COPY BOTH CREDENTIALS** (API Key and Secret)

---

### **Step 3: Create Test Form**

Create a file: `test-form.php`

```php
<?php
// Replace these with your actual values
$CRM_URL = 'http://localhost:5000';
$API_KEY = 'ck_your_key_here';  // ← Paste your API key
$API_SECRET = 'secret_your_secret_here';  // ← Paste your API secret

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $leadData = array(
        'first_name' => $_POST['first_name'],
        'last_name' => $_POST['last_name'],
        'email' => $_POST['email'],
        'phone' => $_POST['phone'] ?? '',
        'company' => $_POST['company'] ?? '',
        
        // Custom fields - THIS IS THE KEY PART!
        'custom_fields' => array(
            'budget' => $_POST['budget'] ?? '',
            'timeline' => $_POST['timeline'] ?? '',
            'company_size' => $_POST['company_size'] ?? '',
            'interested_in' => $_POST['interested_in'] ?? '',
            'hear_about_us' => $_POST['hear_about_us'] ?? '',
            'newsletter' => isset($_POST['newsletter']),
            'test_field_1' => 'This is a test value',
            'test_field_2' => 'Another custom value',
            'numeric_field' => 12345,
            'boolean_field' => true
        )
    );
    
    // Remove empty custom fields
    $leadData['custom_fields'] = array_filter($leadData['custom_fields'], function($v) {
        return $v !== '' && $v !== null;
    });
    
    // Send to CRM
    $ch = curl_init($CRM_URL . '/api/v1/capture/lead');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leadData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'X-API-Key: ' . $API_KEY,
        'X-API-Secret: ' . $API_SECRET
    ));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local testing only
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        echo "<h2 style='color:green'>✓ Success! Lead created.</h2>";
        echo "<p>Response: $response</p>";
        echo "<p><a href='http://localhost:5173/app/leads'>View in CRM</a></p>";
    } else {
        echo "<h2 style='color:red'>✗ Error</h2>";
        echo "<p>HTTP Code: $httpCode</p>";
        echo "<p>Response: $response</p>";
    }
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Custom Fields</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        input, select, textarea { width: 100%; padding: 10px; margin: 5px 0 15px 0; }
        button { background: #007bff; color: white; padding: 12px 30px; border: none; cursor: pointer; }
        label { font-weight: bold; }
    </style>
</head>
<body>
    <h1>🧪 Custom Fields Test Form</h1>
    
    <form method="POST">
        <h3>Standard Fields:</h3>
        
        <label>First Name *</label>
        <input type="text" name="first_name" required>
        
        <label>Last Name *</label>
        <input type="text" name="last_name" required>
        
        <label>Email *</label>
        <input type="email" name="email" required>
        
        <label>Phone</label>
        <input type="tel" name="phone">
        
        <label>Company</label>
        <input type="text" name="company">
        
        <hr>
        <h3>Custom Fields (These will appear in CRM!):</h3>
        
        <label>Budget</label>
        <select name="budget">
            <option value="">Select...</option>
            <option value="<$10k">Less than $10,000</option>
            <option value="$10k-$50k">$10,000 - $50,000</option>
            <option value="$50k-$100k">$50,000 - $100,000</option>
            <option value=">$100k">More than $100,000</option>
        </select>
        
        <label>Timeline</label>
        <select name="timeline">
            <option value="">Select...</option>
            <option value="immediate">Immediate (< 1 month)</option>
            <option value="q1-2024">Q1 2024</option>
            <option value="q2-2024">Q2 2024</option>
            <option value="later">Later</option>
        </select>
        
        <label>Company Size</label>
        <input type="text" name="company_size" placeholder="e.g., 10-50">
        
        <label>Interested In</label>
        <select name="interested_in">
            <option value="">Select...</option>
            <option value="Starter Plan">Starter Plan</option>
            <option value="Professional Plan">Professional Plan</option>
            <option value="Enterprise Plan">Enterprise Plan</option>
        </select>
        
        <label>How did you hear about us?</label>
        <select name="hear_about_us">
            <option value="">Select...</option>
            <option value="Google">Google Search</option>
            <option value="Social Media">Social Media</option>
            <option value="Referral">Referral</option>
            <option value="Other">Other</option>
        </select>
        
        <label>
            <input type="checkbox" name="newsletter" value="yes">
            Subscribe to newsletter
        </label>
        
        <button type="submit">🚀 Submit Test Lead</button>
    </form>
</body>
</html>
```

---

### **Step 4: Run PHP Test Form**

```bash
# In the directory with test-form.php
php -S localhost:8000
```

Visit: `http://localhost:8000/test-form.php`

---

### **Step 5: Submit Test Data**

Fill in the form with test data:
- First Name: `Test`
- Last Name: `User`
- Email: `test@example.com`
- Phone: `1234567890`
- Company: `Test Company`
- **Select options for all custom fields**
- Check the newsletter box

Click "Submit Test Lead"

---

### **Step 6: View Custom Fields in CRM**

1. **Click "View in CRM"** link (or go to http://localhost:5173/app/leads)
2. **Find the test lead** (should be at the top)
3. **Click on the lead** to open details
4. **Scroll down** past Notes section
5. **You should see "Custom Fields" section** with all your custom data!

**Expected Result:**
```
┌─────────────────────────────────────┐
│  Custom Fields              9 fields│
├─────────────────────────────────────┤
│  BUDGET              TIMELINE       │
│  $10k-$50k          Q1 2024         │
│                                     │
│  COMPANY SIZE        INTERESTED IN  │
│  10-50              Enterprise Plan │
│                                     │
│  HEAR ABOUT US       NEWSLETTER     │
│  Google             Yes             │
│                                     │
│  TEST FIELD 1        TEST FIELD 2   │
│  This is a...       Another...      │
│                                     │
│  NUMERIC FIELD       BOOLEAN FIELD  │
│  12345              Yes             │
└─────────────────────────────────────┘
```

---

## ✅ Success Criteria

You'll know it's working when you see:

✅ "Custom Fields" section appears in lead detail  
✅ All 9+ custom fields are displayed  
✅ Field names are formatted nicely (Title Case)  
✅ Boolean fields show "Yes" or "No"  
✅ Numeric fields show as numbers  
✅ Text fields show the values  
✅ Field count badge shows correct number  
✅ Layout is responsive

---

## 🔍 Troubleshooting

### **"Custom Fields section not showing"**
- Check browser console (F12) for errors
- Verify lead was created (check Leads page)
- Refresh the page
- Check custom_fields were sent in API request

### **"API Error - Invalid credentials"**
- Double-check API Key and Secret in test-form.php
- Make sure you copied them correctly (no extra spaces)
- Verify API client is Active in dashboard

### **"CORS Error"**
- Add `http://localhost:8000` to Allowed Origins in API Client
- Or use backend proxy method instead

### **"Fields showing but values missing"**
- Check that form fields have `name` attributes
- Verify values are being sent in `custom_fields` object
- Check PHP error logs

---

## 🎯 What to Test

1. **Different field types:**
   - ✓ Text fields
   - ✓ Select dropdowns
   - ✓ Checkboxes (boolean)
   - ✓ Numbers

2. **Field name formatting:**
   - ✓ `company_size` → "Company Size"
   - ✓ `hear_about_us` → "Hear About Us"
   - ✓ `newsletter` → "Newsletter"

3. **Data display:**
   - ✓ Booleans show as Yes/No
   - ✓ Empty fields don't show
   - ✓ Long text wraps properly

4. **Layout:**
   - ✓ 2 columns on desktop
   - ✓ 1 column on mobile
   - ✓ Proper spacing

---

## 📊 Advanced Testing

### **Test with cURL:**

```bash
curl -X POST http://localhost:5000/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ck_your_key" \
  -H "X-API-Secret: secret_your_secret" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "custom_fields": {
      "test1": "value1",
      "test2": "value2",
      "test3": true,
      "test4": 12345
    }
  }'
```

### **Test with Many Fields:**

Send 20+ custom fields and verify:
- All fields display
- Grid layout works
- Scrolling works
- Performance is good

### **Test with Complex Data:**

```json
"custom_fields": {
  "long_text": "This is a very long text value that should wrap properly in the UI without breaking the layout or causing any issues with display",
  "special_chars": "Test with émojis 🎉 and spëcial çhars",
  "numbers": 999999,
  "negative": -500,
  "decimal": 99.99,
  "boolean_true": true,
  "boolean_false": false,
  "array": "[1,2,3]",
  "url": "https://example.com"
}
```

---

## 📝 Verification Checklist

After testing, verify:

- [ ] Custom Fields section appears in lead detail
- [ ] All custom fields are displayed correctly
- [ ] Field names are formatted (Title Case)
- [ ] Boolean values show as Yes/No
- [ ] Field count badge is correct
- [ ] Layout is responsive (test on mobile)
- [ ] No console errors
- [ ] API Client creation works with field mapping
- [ ] Field mapping UI appears in create modal
- [ ] Documentation is complete

---

## 🎉 Next Steps

Once testing is successful:

1. **Share with clients** - Send them the integration guide
2. **Monitor usage** - Check what custom fields are being used
3. **Gather feedback** - Ask clients what they think
4. **Document patterns** - Note common custom fields
5. **Consider enhancements** - Based on usage patterns

---

## 📚 Documentation

- **Complete Guide:** `docs/CUSTOM_FIELDS_GUIDE.md`
- **Implementation Summary:** `docs/CUSTOM_FIELDS_IMPLEMENTATION_SUMMARY.md`
- **API Integration:** `docs/lead-capture-api-integration-guide.md`

---

**Ready to test? Start with Step 1! 🚀**


