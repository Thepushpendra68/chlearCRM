# 🧪 Custom Fields System - Comprehensive Testing Guide

## ✅ Testing Checklist

This guide will help you verify that:
1. ✅ **Multi-Tenancy Works** - Each company only sees their own custom fields
2. ✅ **API Integration Works** - Custom fields work with lead capture API
3. ✅ **Field Names are Unique** - Each field has a unique name for integration
4. ✅ **Validation Works** - Custom field definitions enforce data quality

---

## 🏢 Test 1: Multi-Tenancy (Company Isolation)

### **Objective**: Verify that Company A cannot see or use Company B's custom fields

### **Setup Required**:
- Two companies in your system
- Two users (one per company) with Manager or Admin role

### **Test Steps**:

#### **Part A: Create Fields as Company A**

1. **Log in as Company A user**
2. Navigate to **Custom Fields**
3. Create a custom field:
   ```
   Field Name: company_a_budget
   Field Label: Company A Budget
   Entity Type: Lead
   Data Type: Select
   Options: $10k, $50k, $100k
   ```
4. **Verify**: Field appears in the list

#### **Part B: Verify Company B Cannot See It**

1. **Log out** from Company A
2. **Log in as Company B user**
3. Navigate to **Custom Fields**
4. **Expected Result**: `company_a_budget` field is **NOT visible**

#### **Part C: Create Company B Field**

1. While logged in as Company B, create:
   ```
   Field Name: company_b_revenue
   Field Label: Company B Revenue
   Entity Type: Lead
   Data Type: Currency
   ```
2. **Verify**: Only `company_b_revenue` is visible (not `company_a_budget`)

#### **Part D: Database Verification**

Run this SQL query:
```sql
-- Check that fields are properly isolated by company
SELECT 
  id,
  company_id,
  field_name,
  field_label
FROM custom_field_definitions
ORDER BY company_id, field_name;
```

**Expected Result**: Each field has a different `company_id`

### **✅ Pass Criteria**:
- [x] Company A sees only their fields
- [x] Company B sees only their fields
- [x] Fields are isolated by company_id in database
- [x] RLS policies enforce company separation

---

## 🔌 Test 2: API Integration with Custom Fields

### **Objective**: Verify that API lead capture validates against custom field definitions

### **Setup Required**:
- API Client created for your company
- Custom field definitions created

### **Test Steps**:

#### **Step 1: Create Custom Field Definitions**

Create these fields via the Custom Fields UI:

```yaml
Field 1:
  field_name: budget_range
  field_label: Budget Range
  entity_type: lead
  data_type: select
  options: ["< $10k", "$10k - $50k", "$50k - $100k", "> $100k"]
  required: true

Field 2:
  field_name: company_size
  field_label: Company Size
  entity_type: lead
  data_type: select
  options: ["1-10", "11-50", "51-200", "200+"]
  required: false

Field 3:
  field_name: interested_products
  field_label: Interested Products
  entity_type: lead
  data_type: multiselect
  options: ["Product A", "Product B", "Product C"]
  required: false

Field 4:
  field_name: newsletter_signup
  field_label: Newsletter Signup
  entity_type: lead
  data_type: boolean
  required: false

Field 5:
  field_name: project_budget
  field_label: Project Budget
  entity_type: lead
  data_type: currency
  required: false
```

#### **Step 2: Test Valid API Request**

```bash
curl -X POST https://your-crm-api.com/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-API-Secret: YOUR_API_SECRET" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Test Corp",
    "custom_fields": {
      "budget_range": "$10k - $50k",
      "company_size": "11-50",
      "interested_products": ["Product A", "Product B"],
      "newsletter_signup": true,
      "project_budget": 25000
    }
  }'
```

**Expected Response**: `201 Created` with lead ID

#### **Step 3: Test Invalid Field Value**

```bash
curl -X POST https://your-crm-api.com/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-API-Secret: YOUR_API_SECRET" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "custom_fields": {
      "budget_range": "Invalid Option"
    }
  }'
```

**Expected Response**: `400 Bad Request` with validation error

#### **Step 4: Test Missing Required Field**

```bash
curl -X POST https://your-crm-api.com/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-API-Secret: YOUR_API_SECRET" \
  -d '{
    "first_name": "Bob",
    "last_name": "Johnson",
    "email": "bob@example.com",
    "custom_fields": {
      "company_size": "1-10"
    }
  }'
```

**Expected Response**: `400 Bad Request` - "Budget Range is required"

#### **Step 5: Verify Lead in Dashboard**

1. Go to **Leads** page
2. Find the successfully created lead
3. Click to view details
4. Scroll to **Custom Fields** section
5. **Verify**: All custom fields are displayed with correct values

### **✅ Pass Criteria**:
- [x] Valid custom fields are accepted
- [x] Invalid field values are rejected
- [x] Required fields are enforced
- [x] Data types are validated
- [x] Custom fields display correctly in UI

---

## 🔤 Test 3: Field Name Uniqueness for Integration

### **Objective**: Verify each field has a unique name within an entity type

### **Test Steps**:

#### **Step 1: Create First Field**

1. Navigate to **Custom Fields**
2. Click **Create Custom Field**
3. Create:
   ```
   Field Name: budget
   Field Label: Budget
   Entity Type: Lead
   Data Type: Currency
   ```
4. **Verify**: Field created successfully

#### **Step 2: Attempt Duplicate Name (Same Entity)**

1. Click **Create Custom Field** again
2. Try to create:
   ```
   Field Name: budget  (same name)
   Field Label: Project Budget
   Entity Type: Lead  (same entity)
   Data Type: Currency
   ```
3. **Expected Result**: Error message - "Field name already exists for lead"

#### **Step 3: Create Same Name (Different Entity)**

1. Click **Create Custom Field** again
2. Create:
   ```
   Field Name: budget  (same name)
   Field Label: Contact Budget
   Entity Type: Contact  (different entity)
   Data Type: Currency
   ```
3. **Expected Result**: Success! (Same name is OK for different entity types)

#### **Step 4: Verify in Database**

```sql
-- Check uniqueness constraint
SELECT 
  entity_type,
  field_name,
  field_label,
  COUNT(*) as count
FROM custom_field_definitions
WHERE company_id = 'YOUR_COMPANY_ID'
GROUP BY entity_type, field_name, field_label
HAVING COUNT(*) > 1;
```

**Expected Result**: No rows (no duplicates)

### **✅ Pass Criteria**:
- [x] Cannot create duplicate field names within same entity type
- [x] Can create same field name for different entity types
- [x] Database constraint prevents duplicates
- [x] Error message is clear and helpful

---

## ✅ Test 4: Validation Rules Enforcement

### **Objective**: Verify that validation rules work correctly

### **Test Setup**: Create these test fields

```yaml
Field 1:
  field_name: team_size
  field_label: Team Size
  data_type: number
  validation_rules: { "min": 1, "max": 1000 }

Field 2:
  field_name: company_website
  field_label: Company Website
  data_type: url

Field 3:
  field_name: contact_email
  field_label: Contact Email
  data_type: email

Field 4:
  field_name: rating
  field_label: Customer Rating
  data_type: decimal
  validation_rules: { "min": 0, "max": 5 }
```

### **Test Cases**:

#### **Test 4.1: Number Range Validation**

```bash
# Valid
POST /api/v1/capture/lead
{
  "custom_fields": {
    "team_size": 50  ✅ Valid (within 1-1000)
  }
}

# Invalid
{
  "custom_fields": {
    "team_size": 1500  ❌ Should fail (> 1000)
  }
}
```

#### **Test 4.2: URL Validation**

```bash
# Valid
{
  "custom_fields": {
    "company_website": "https://example.com"  ✅ Valid URL
  }
}

# Invalid
{
  "custom_fields": {
    "company_website": "not-a-url"  ❌ Should fail
  }
}
```

#### **Test 4.3: Email Validation**

```bash
# Valid
{
  "custom_fields": {
    "contact_email": "john@example.com"  ✅ Valid email
  }
}

# Invalid
{
  "custom_fields": {
    "contact_email": "invalid-email"  ❌ Should fail
  }
}
```

### **✅ Pass Criteria**:
- [x] Min/max values are enforced
- [x] URL format is validated
- [x] Email format is validated
- [x] Decimal range is validated
- [x] Clear error messages returned

---

## 📊 Test 5: Usage Statistics

### **Objective**: Verify usage tracking works correctly

### **Test Steps**:

#### **Step 1: Create Test Field**

Create a field called `test_usage_field`

#### **Step 2: Check Initial Usage**

1. Click the **Usage Stats** icon (chart) next to the field
2. **Expected**: 
   - Total Usage: 0
   - Unique Values: 0
   - Last Used: Never

#### **Step 3: Create Leads with Field**

Create 3 leads via API with the field:
- Lead 1: `test_usage_field: "Value A"`
- Lead 2: `test_usage_field: "Value B"`
- Lead 3: `test_usage_field: "Value A"` (duplicate)

#### **Step 4: Check Updated Usage**

1. Refresh and click **Usage Stats** again
2. **Expected**:
   - Total Usage: 3
   - Unique Values: 2 (Value A and Value B)
   - Last Used: (recent timestamp)

#### **Step 5: Attempt to Delete**

1. Try to delete the field
2. **Expected**: Error - "Field is currently being used in 3 lead(s)"

### **✅ Pass Criteria**:
- [x] Usage count is accurate
- [x] Unique values counted correctly
- [x] Last used timestamp updates
- [x] Cannot delete fields in use
- [x] Can delete unused fields

---

## 🔄 Test 6: Field Ordering and Reordering

### **Objective**: Verify field ordering works

### **Test Steps**:

1. Create 3 fields for the same entity
2. **Verify**: They appear in creation order (display_order)
3. Note the current order
4. Use drag-and-drop (if implemented) or API to reorder
5. **Verify**: New order is persisted
6. Refresh page
7. **Verify**: Order is maintained after refresh

### **API Test**:

```bash
POST /api/custom-fields/reorder
{
  "entity_type": "lead",
  "field_orders": [
    {"id": "field-3-id", "display_order": 0},
    {"id": "field-1-id", "display_order": 1},
    {"id": "field-2-id", "display_order": 2}
  ]
}
```

### **✅ Pass Criteria**:
- [x] Fields display in correct order
- [x] Order can be changed
- [x] Order persists after refresh
- [x] API reorder works

---

## 🔐 Test 7: Role-Based Access Control

### **Objective**: Verify permissions work correctly

### **Test Matrix**:

| Action | Sales Rep | Manager | Company Admin | Super Admin |
|--------|-----------|---------|---------------|-------------|
| View Fields | ✅ | ✅ | ✅ | ✅ |
| Create Fields | ❌ | ✅ | ✅ | ✅ |
| Edit Fields | ❌ | ✅ | ✅ | ✅ |
| Delete Fields | ❌ | ❌ | ✅ | ✅ |
| View Usage | ✅ | ✅ | ✅ | ✅ |

### **Test Steps**:

1. **Test as Sales Rep**: 
   - Can view Custom Fields menu? **NO** (menu hidden)
   - Can access `/app/custom-fields`? **NO** (redirected)

2. **Test as Manager**:
   - Can view menu? **YES**
   - Can create field? **YES**
   - Can edit field? **YES**
   - Can delete field? **NO** (button disabled)

3. **Test as Company Admin**:
   - Can do everything? **YES**

### **✅ Pass Criteria**:
- [x] Sales reps cannot access
- [x] Managers can create/edit but not delete
- [x] Admins have full access
- [x] Permissions enforced at API level
- [x] UI reflects user permissions

---

## 🎯 Test 8: Complete Integration Flow

### **Objective**: End-to-end test of the entire system

### **Scenario**: Real Estate Company Capturing Leads

#### **Step 1: Define Custom Fields (5 min)**

As Company Admin, create:
```yaml
1. property_type (Select: House, Apartment, Condo, Land)
2. budget_range (Select: <$500k, $500k-$1M, $1M-$2M, >$2M)
3. num_bedrooms (Select: 1, 2, 3, 4, 5+)
4. preferred_location (Text)
5. move_in_date (Date)
6. has_pets (Boolean)
7. additional_requirements (Text Area)
```

#### **Step 2: Create API Client (2 min)**

1. Go to **API Clients**
2. Create client for "Website Contact Form"
3. Copy API Key and Secret

#### **Step 3: Configure Website Form (External)**

HTML Form:
```html
<form id="leadForm">
  <input name="first_name" required>
  <input name="last_name" required>
  <input type="email" name="email" required>
  <input type="tel" name="phone">
  
  <select name="property_type">
    <option value="House">House</option>
    <option value="Apartment">Apartment</option>
    <option value="Condo">Condo</option>
    <option value="Land">Land</option>
  </select>
  
  <select name="budget_range">
    <option value="<$500k">Under $500k</option>
    <option value="$500k-$1M">$500k - $1M</option>
    <option value="$1M-$2M">$1M - $2M</option>
    <option value=">$2M">Over $2M</option>
  </select>
  
  <select name="num_bedrooms">
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    <option value="5+">5+</option>
  </select>
  
  <input name="preferred_location" placeholder="e.g., Downtown">
  <input type="date" name="move_in_date">
  <label><input type="checkbox" name="has_pets"> Have Pets?</label>
  <textarea name="additional_requirements"></textarea>
  
  <button type="submit">Submit</button>
</form>
```

PHP Handler (submit-lead.php):
```php
<?php
$leadData = array(
    'first_name' => $_POST['first_name'],
    'last_name' => $_POST['last_name'],
    'email' => $_POST['email'],
    'phone' => $_POST['phone'],
    'custom_fields' => array(
        'property_type' => $_POST['property_type'],
        'budget_range' => $_POST['budget_range'],
        'num_bedrooms' => $_POST['num_bedrooms'],
        'preferred_location' => $_POST['preferred_location'],
        'move_in_date' => $_POST['move_in_date'],
        'has_pets' => isset($_POST['has_pets']),
        'additional_requirements' => $_POST['additional_requirements']
    )
);

$ch = curl_init('https://your-crm.com/api/v1/capture/lead');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leadData));
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'X-API-Key: YOUR_API_KEY',
    'X-API-Secret: YOUR_API_SECRET'
));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    header('Location: thank-you.html');
} else {
    header('Location: error.html');
}
?>
```

#### **Step 4: Submit Test Lead (2 min)**

Fill out and submit the form with test data

#### **Step 5: Verify in CRM (2 min)**

1. Go to **Leads** page
2. Find the new lead
3. Click to view details
4. **Verify Custom Fields Section Shows**:
   - Property Type: House
   - Budget Range: $500k - $1M
   - Num Bedrooms: 3
   - Preferred Location: Downtown
   - Move In Date: 2024-12-01
   - Has Pets: Yes
   - Additional Requirements: (text content)

#### **Step 6: Check Usage Statistics (1 min)**

1. Go to **Custom Fields**
2. Click usage stats for each field
3. **Verify**: Count = 1 for each

### **✅ Pass Criteria**:
- [x] Custom fields created successfully
- [x] API client configured
- [x] Form submits successfully
- [x] Lead appears in CRM
- [x] All custom fields visible
- [x] Values correctly formatted
- [x] Usage stats updated
- [x] End-to-end flow works seamlessly

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Custom Fields menu not showing"**
**Solution**: User must be Manager, Company Admin, or Super Admin

### **Issue 2: "Cannot create field - already exists"**
**Solution**: Field name must be unique within entity type. Try different name.

### **Issue 3: "API returns validation error"**
**Solution**: 
- Check field value matches defined options
- Ensure required fields are provided
- Verify data type is correct

### **Issue 4: "Custom fields not showing in lead detail"**
**Solution**:
- Ensure lead has custom_fields data
- Check that fields are marked as active
- Refresh the page

### **Issue 5: "Cannot delete field"**
**Solution**: Field is in use. Remove it from all records first, or deactivate instead.

---

## 📋 Final Verification Checklist

Run through this checklist to ensure everything works:

### **Database**
- [ ] Migration ran successfully
- [ ] All tables created
- [ ] Indexes exist
- [ ] RLS policies active
- [ ] Triggers working

### **Backend API**
- [ ] All endpoints respond
- [ ] Authentication works
- [ ] Authorization works
- [ ] Validation works
- [ ] Error handling works

### **Frontend UI**
- [ ] Page loads without errors
- [ ] Can create fields
- [ ] Can edit fields
- [ ] Can delete fields
- [ ] Filters work
- [ ] Search works
- [ ] Modals open/close
- [ ] Success messages show
- [ ] Error messages show

### **Integration**
- [ ] API lead capture works
- [ ] Validation enforced
- [ ] Custom fields display
- [ ] Usage tracking works
- [ ] Multi-tenancy works

### **Security**
- [ ] Company isolation verified
- [ ] Role permissions work
- [ ] RLS policies enforced
- [ ] Audit logging works

---

## ✅ Success Criteria

**Your implementation is working correctly if:**

1. ✅ Each company only sees their own custom fields
2. ✅ Field names are unique within entity types
3. ✅ API validates custom fields against definitions
4. ✅ Invalid data is rejected with clear errors
5. ✅ Custom fields display correctly in UI
6. ✅ Usage statistics track accurately
7. ✅ Role-based permissions work
8. ✅ Can create, edit, and delete fields
9. ✅ Complete end-to-end flow works

---

**🎉 If all tests pass, your Custom Fields System is production-ready!**

---

**Testing Date**: ___________  
**Tested By**: ___________  
**Result**: ☐ PASS  ☐ FAIL  
**Notes**: ___________


