# 📋 Custom Fields Management - Complete Guide

## 🎉 Overview

The Custom Fields Management System allows you to define, manage, and apply custom fields across your CRM entities (Leads, Contacts, Companies, Deals, Tasks, Activities). This comprehensive system gives you full control over what data you collect and how it's structured.

---

## ✨ Key Features

### ✅ **Complete CRUD Operations**
- Create new custom field definitions
- View all custom fields with filtering
- Edit existing custom fields
- Delete unused custom fields

### ✅ **Multiple Data Types**
- **Text** - Single line text input
- **Text Area** - Multi-line text input
- **Number** - Integer values
- **Decimal** - Floating point numbers
- **Boolean** - Yes/No (checkbox)
- **Date** - Date picker
- **Date & Time** - Date and time picker
- **Select** - Dropdown (single select)
- **Multi-Select** - Dropdown (multiple selections)
- **Email** - Email input with validation
- **Phone** - Phone number input
- **URL** - Website URL with validation
- **Currency** - Monetary values

### ✅ **Validation Rules**
- Required fields
- Unique values only
- Min/max values for numbers
- Min/max length for text
- Pattern matching (regex)
- Custom validation rules

### ✅ **Entity Support**
- **Leads** - Capture additional lead information
- **Contacts** - Extended contact details
- **Companies** - Company-specific fields
- **Deals** - Deal custom attributes
- **Tasks** - Task metadata
- **Activities** - Activity details

### ✅ **Advanced Features**
- Searchable fields
- Field ordering/reordering
- Active/inactive status
- Usage statistics
- Field audit trail
- System fields (protected)

---

## 🚀 Getting Started

### **Step 1: Access Custom Fields Management**

1. Log in to your CRM
2. Navigate to **Custom Fields** in the sidebar
   - Available for Managers, Company Admins, and Super Admins

### **Step 2: View Existing Custom Fields**

The Custom Fields page shows:
- All defined custom fields
- Entity type (Leads, Contacts, etc.)
- Data type
- Properties (Required, Unique, Searchable)
- Status (Active/Inactive)
- Actions (View Usage, Edit, Delete)

### **Step 3: Filter Custom Fields**

Use the filters to find specific fields:
- **Entity Type**: Filter by entity (Leads, Contacts, etc.)
- **Status**: Show all, active only, or inactive only
- **Search**: Search by field name or label

---

## 📝 Creating Custom Fields

### **Basic Custom Field Creation**

1. Click **"Create Custom Field"** button
2. Fill in the required information:
   - **Field Name**: Internal name (e.g., `budget_range`)
     - Must start with a letter
     - Lowercase only
     - Use underscores for spaces
   - **Field Label**: Display name (e.g., "Budget Range")
   - **Description**: Optional description
   - **Entity Type**: Where this field will be used
   - **Data Type**: Type of data to collect

3. Configure optional settings:
   - **Placeholder**: Hint text for input
   - **Help Text**: Additional guidance for users
   - **Required**: Make field mandatory
   - **Unique**: Enforce unique values
   - **Searchable**: Include in search results
   - **Active**: Enable/disable the field

4. Click **"Create Field"**

### **Example: Budget Range Field**

```
Field Name: budget_range
Field Label: Budget Range
Description: Expected project budget
Entity Type: Lead
Data Type: Select
Options:
  - < $10,000
  - $10,000 - $50,000
  - $50,000 - $100,000
  - > $100,000
Required: Yes
Searchable: Yes
```

### **Example: Company Size Field**

```
Field Name: company_size
Field Label: Company Size
Description: Number of employees
Entity Type: Company
Data Type: Select
Options:
  - 1-10
  - 11-50
  - 51-200
  - 201-500
  - 500+
Required: No
Searchable: Yes
```

---

## 🛠️ Data Types Guide

### **Text**
- Single line text input
- Good for: Names, short descriptions, codes
- Example: `customer_id`, `preferred_name`

### **Text Area**
- Multi-line text input
- Good for: Long descriptions, notes, comments
- Example: `special_requirements`, `pain_points`

### **Number**
- Integer values only
- Good for: Counts, quantities, IDs
- Example: `team_size`, `num_locations`
- Validation: Min/max values

### **Decimal**
- Floating point numbers
- Good for: Measurements, ratings, percentages
- Example: `satisfaction_score`, `discount_percentage`
- Validation: Min/max values, decimal places

### **Boolean**
- Yes/No checkbox
- Good for: Flags, toggles, consents
- Example: `newsletter_signup`, `gdpr_consent`, `onboarding_complete`

### **Date**
- Date picker (YYYY-MM-DD)
- Good for: Birthdates, deadlines, start dates
- Example: `contract_start_date`, `renewal_date`

### **Date & Time**
- Date and time picker
- Good for: Appointments, timestamps, events
- Example: `demo_scheduled`, `last_contact_datetime`

### **Select (Dropdown)**
- Single selection from predefined options
- Good for: Categories, statuses, tiers
- Example: `industry`, `plan_type`, `priority_level`
- **Requires**: List of options

### **Multi-Select**
- Multiple selections from predefined options
- Good for: Tags, interests, features
- Example: `interested_products`, `preferred_channels`, `skills`
- **Requires**: List of options

### **Email**
- Email input with validation
- Good for: Secondary emails, referral contacts
- Example: `billing_email`, `technical_contact_email`
- Validation: Email format

### **Phone**
- Phone number input
- Good for: Secondary phones, emergency contacts
- Example: `mobile_phone`, `office_phone`

### **URL**
- Website URL with validation
- Good for: Websites, social profiles, documents
- Example: `linkedin_profile`, `company_website`
- Validation: Valid URL format

### **Currency**
- Monetary values
- Good for: Budgets, revenue, costs
- Example: `annual_revenue`, `project_budget`
- Validation: Min/max values, currency format

---

## ✏️ Editing Custom Fields

### **What Can Be Edited**

You can edit:
- Field label
- Field description
- Field options (for select/multiselect)
- Placeholder text
- Help text
- Validation rules
- Required status
- Unique status
- Searchable status
- Active/inactive status

### **What Cannot Be Edited**

You cannot edit:
- Field name (internal identifier)
- Entity type
- System fields (protected)

### **How to Edit**

1. Click the **Edit** button next to the field
2. Modify the desired properties
3. Click **"Update Field"**

⚠️ **Warning**: Changing field requirements (e.g., making a field required) may affect existing records.

---

## 🗑️ Deleting Custom Fields

### **Requirements for Deletion**

- Field must not be a system field
- Field must not be in use in any records
- User must be a Company Admin or Super Admin

### **How to Delete**

1. Click the **Delete** button next to the field
2. Confirm deletion in the modal
3. Field will be removed from all configurations

### **What Happens When Deleted**

- Field definition is permanently deleted
- Field cannot be restored (create new one instead)
- Audit trail is preserved

---

## 📊 Usage Statistics

View how your custom fields are being used:

### **View Individual Field Usage**

1. Click the **Usage Stats** button (chart icon) next to any field
2. See:
   - **Total Usage**: Number of records using this field
   - **Unique Values**: Number of distinct values
   - **Last Used**: When the field was last populated

### **Usage Statistics Help With**

- Identifying unused fields (candidates for deletion)
- Understanding field adoption
- Validating field design
- Cleaning up redundant fields

---

## 🎯 Best Practices

### **Naming Conventions**

✅ **Good Field Names:**
- `budget_range`
- `company_size`
- `interested_products`
- `preferred_contact_time`

❌ **Bad Field Names:**
- `budgetRange` (no camelCase)
- `Budget Range` (no spaces)
- `field1` (not descriptive)
- `_budget` (doesn't start with letter)

### **Field Design**

1. **Keep field names descriptive**
   - Use clear, meaningful names
   - Avoid abbreviations unless standard

2. **Choose appropriate data types**
   - Use select/multiselect for predefined options
   - Use text for free-form input
   - Use boolean for yes/no questions

3. **Provide help text**
   - Explain what the field is for
   - Give examples when helpful
   - Clarify requirements

4. **Make fields required thoughtfully**
   - Only require truly essential fields
   - Too many required fields = user friction

5. **Use validation rules**
   - Enforce data quality
   - Prevent invalid input
   - Make validation messages clear

### **Organization**

1. **Use display order**
   - Group related fields together
   - Most important fields first
   - Logical flow through fields

2. **Deactivate vs. Delete**
   - Deactivate fields you might need later
   - Only delete truly obsolete fields
   - Check usage statistics first

3. **Regular audits**
   - Review custom fields quarterly
   - Remove unused fields
   - Update options as needed

---

## 🔐 Permissions

### **View Custom Fields**
- All authenticated users can view

### **Create Custom Fields**
- Managers
- Company Admins
- Super Admins

### **Edit Custom Fields**
- Managers
- Company Admins
- Super Admins

### **Delete Custom Fields**
- Company Admins
- Super Admins

### **System Fields**
- Cannot be edited or deleted by anyone
- Managed by system administrators

---

## 💡 Use Cases & Examples

### **Use Case 1: Real Estate CRM**

```yaml
Custom Fields for Leads:
  property_type:
    Label: Property Type
    Type: Select
    Options: [House, Apartment, Commercial, Land]
    Required: Yes

  budget_range:
    Label: Budget Range
    Type: Select
    Options: [< $500k, $500k - $1M, $1M - $2M, > $2M]
    Required: Yes

  preferred_location:
    Label: Preferred Location
    Type: Text
    Required: No

  num_bedrooms:
    Label: Number of Bedrooms
    Type: Select
    Options: [1, 2, 3, 4, 5+]
    Required: No

  move_in_date:
    Label: Desired Move-in Date
    Type: Date
    Required: No
```

### **Use Case 2: SaaS Company**

```yaml
Custom Fields for Leads:
  company_size:
    Label: Company Size
    Type: Select
    Options: [1-10, 11-50, 51-200, 201-500, 500+]
    Required: Yes

  current_tool:
    Label: Current Tool
    Type: Text
    Required: No

  monthly_budget:
    Label: Monthly Budget
    Type: Currency
    Required: No

  interested_features:
    Label: Interested Features
    Type: Multi-Select
    Options: [Analytics, Automation, Integrations, Mobile App]
    Required: No

  demo_requested:
    Label: Demo Requested
    Type: Boolean
    Required: No
```

### **Use Case 3: Consulting Firm**

```yaml
Custom Fields for Leads:
  service_type:
    Label: Service Type
    Type: Select
    Options: [Strategy, Operations, Technology, HR]
    Required: Yes

  project_scope:
    Label: Project Scope
    Type: Text Area
    Required: Yes

  estimated_timeline:
    Label: Estimated Timeline
    Type: Select
    Options: [< 3 months, 3-6 months, 6-12 months, > 12 months]
    Required: Yes

  budget:
    Label: Project Budget
    Type: Currency
    Required: No

  pain_points:
    Label: Current Challenges
    Type: Text Area
    Required: No
```

---

## 🔧 Technical Details

### **Database Storage**

Custom field definitions are stored in the `custom_field_definitions` table with the following structure:

```sql
- id (UUID)
- company_id (UUID)
- field_name (TEXT)
- field_label (TEXT)
- field_description (TEXT)
- entity_type (ENUM)
- data_type (ENUM)
- is_required (BOOLEAN)
- is_unique (BOOLEAN)
- is_searchable (BOOLEAN)
- field_options (JSONB)
- validation_rules (JSONB)
- display_order (INTEGER)
- placeholder (TEXT)
- help_text (TEXT)
- default_value (TEXT)
- is_active (BOOLEAN)
- is_system_field (BOOLEAN)
```

### **Custom Field Values**

Values are still stored in the entity's `custom_fields` JSONB column:

```json
{
  "budget_range": "$50,000 - $100,000",
  "company_size": "51-200",
  "interested_features": ["Analytics", "Automation"],
  "demo_requested": true
}
```

### **Validation**

Custom fields are validated against their definitions:
- Required fields must have values
- Unique fields are checked for duplicates
- Data types are enforced
- Select options are validated
- Validation rules are applied

### **API Endpoints**

```
GET    /api/custom-fields              - List all custom fields
GET    /api/custom-fields/:id          - Get single custom field
POST   /api/custom-fields              - Create custom field
PUT    /api/custom-fields/:id          - Update custom field
DELETE /api/custom-fields/:id          - Delete custom field
POST   /api/custom-fields/reorder      - Reorder fields
GET    /api/custom-fields/:id/usage    - Get usage stats
GET    /api/custom-fields/usage/all    - Get all usage stats
POST   /api/custom-fields/validate     - Validate custom fields
```

---

## 🐛 Troubleshooting

### **Field Not Appearing**

**Problem**: Created field doesn't show up
**Solution**:
- Verify field is marked as "Active"
- Check entity type matches where you're looking
- Refresh the page
- Check user permissions

### **Cannot Delete Field**

**Problem**: Delete button is disabled or error occurs
**Solution**:
- Field may be a system field (cannot delete)
- Field may be in use (check usage statistics)
- Only Company Admins can delete fields

### **Validation Errors**

**Problem**: Cannot create/update field
**Solution**:
- Field name must be unique within entity type
- Field name must be lowercase with underscores only
- Select/multiselect must have at least one option
- Check all required fields are filled

### **Field Name Already Exists**

**Problem**: Error: "Field name already exists for this entity"
**Solution**:
- Choose a different field name
- Or edit the existing field instead
- Field names must be unique per entity type

---

## 📈 Analytics & Reporting

### **Field Usage Report**

Generate reports showing:
- Most used custom fields
- Least used custom fields
- Fields with highest unique values
- Recently added fields
- Inactive fields

### **Data Quality Metrics**

Monitor:
- Required field completion rates
- Unique value violations
- Validation rule failures
- Most common field values

---

## 🔄 Migration Guide

### **Existing Custom Fields (API Captured)**

If you already have custom fields from API lead capture:

1. **They still work!**
   - No breaking changes
   - Existing custom fields display as before

2. **Create Definitions for Existing Fields**
   - Review commonly used custom field names
   - Create custom field definitions for them
   - Future leads will be validated against definitions

3. **Gradual Migration**
   - Define fields incrementally
   - No need to migrate all at once
   - Both approaches work simultaneously

---

## 🆘 Support

### **Getting Help**

1. Check this documentation
2. Review use case examples
3. Check usage statistics
4. Contact your CRM administrator
5. Reach out to support team

### **Common Questions**

**Q: Can I change a field name after creation?**
A: No, field names are permanent identifiers. Create a new field if needed.

**Q: What happens to existing data when I delete a field?**
A: Data remains in the custom_fields JSONB, but won't be displayed or validated.

**Q: Can I export custom field data?**
A: Yes, custom fields are included in entity exports.

**Q: Can I share custom field definitions across companies?**
A: No, custom fields are company-specific.

**Q: Is there a limit on custom fields?**
A: No hard limit, but we recommend < 20 fields per entity for UX.

---

## 🎉 Summary

### **What You Can Do Now**

✅ Create custom field definitions for any entity  
✅ Edit and manage existing custom fields  
✅ View usage statistics  
✅ Delete unused custom fields  
✅ Validate data against field definitions  
✅ Organize fields with ordering  
✅ Control field visibility with active/inactive status  
✅ Track changes with audit logs

### **Next Steps**

1. **Audit Existing Custom Fields**
   - Review what's being used
   - Create definitions for common fields

2. **Standardize Field Names**
   - Ensure consistency across API clients
   - Document field naming conventions

3. **Train Your Team**
   - Share this documentation
   - Explain best practices
   - Get feedback on field requirements

4. **Monitor Usage**
   - Check usage statistics regularly
   - Remove unused fields
   - Add new fields as needed

---

**📅 Last Updated**: October 29, 2024  
**📦 Version**: 1.0.0  
**📝 Status**: Production Ready

---

**Need Help?** Contact your CRM administrator or support team.

**Found a bug?** Report it through your normal support channels.

**Have feedback?** We'd love to hear how you're using custom fields!

