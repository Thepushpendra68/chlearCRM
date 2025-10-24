# Sakha CRM - Configuration Guide

## Overview

Sakha CRM is now a **configuration-driven framework** that can be easily customized for different industries without modifying core code. This guide explains how to fork the repository and adapt it to your specific needs.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration Architecture](#configuration-architecture)
3. [Industry Types](#industry-types)
4. [Field Configuration](#field-configuration)
5. [Terminology Customization](#terminology-customization)
6. [Form Layout Design](#form-layout-design)
7. [Validation Rules](#validation-rules)
8. [Pipeline Configuration](#pipeline-configuration)
9. [Examples](#examples)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Step 1: Fork the Repository

```bash
git clone https://github.com/your-org/sakha-crm.git my-custom-crm
cd my-custom-crm
```

### Step 2: Create Industry Configuration

```bash
# Backend configuration
cp backend/src/config/industry/base.config.js backend/src/config/industry/my_industry.config.js

# Edit the new file with your industry-specific settings
nano backend/src/config/industry/my_industry.config.js
```

### Step 3: Register Your Industry Configuration

Edit `backend/src/config/industry/configLoader.js`:

```javascript
const baseConfig = require('./base.config');
const schoolConfig = require('./school.config');
const myIndustryConfig = require('./my_industry.config'); // Add this

const industryConfigs = {
  generic: baseConfig,
  school: schoolConfig,
  my_industry: myIndustryConfig, // Add this
};
```

### Step 4: Update Company Industry Type

In Supabase SQL Editor:

```sql
UPDATE companies 
SET industry_type = 'my_industry' 
WHERE id = 'your-company-id';
```

### Step 5: Restart Application

```bash
# Backend
cd backend
npm run dev

# Frontend (in separate terminal)
cd frontend
npm run dev
```

Your CRM now uses your custom configuration!

---

## Configuration Architecture

### File Structure

```
backend/src/config/industry/
├── base.config.js          # Generic CRM configuration (template)
├── school.config.js        # Example: School admissions CRM
├── my_industry.config.js   # Your custom industry config
└── configLoader.js         # Configuration loader service

frontend/
└── (uses backend config via API)
```

### Configuration Object Structure

Each industry configuration exports an object with these sections:

```javascript
module.exports = {
  // Industry identifier (must match database value)
  industryType: 'my_industry',
  
  // Display name
  industryName: 'My Industry CRM',
  
  // Custom terminology mappings
  terminology: {
    lead: 'Customer',
    leads: 'Customers',
    // ... more terms
  },
  
  // Core field definitions (built-in database fields)
  coreFields: {
    firstName: { /* field config */ },
    lastName: { /* field config */ },
    // ... more core fields
  },
  
  // Custom fields (stored in custom_fields JSONB)
  customFields: {
    myCustomField: { /* field config */ },
    // ... more custom fields
  },
  
  // Form layout (how fields are organized in UI)
  formLayout: {
    sections: [
      {
        id: 'section1',
        title: 'Section Title',
        fields: ['firstName', 'lastName', 'myCustomField']
      }
    ]
  },
  
  // Default pipeline stages
  pipeline: {
    defaultStages: [ /* stage definitions */ ]
  },
  
  // Lead source options
  leadSources: [ /* source options */ ],
  
  // Status options
  leadStatuses: [ /* status options */ ],
  
  // Validation rules
  validation: {
    requireContactMethod: true,
    preventDuplicateEmail: true
  }
};
```

---

## Industry Types

### Supported Industry Types

1. **generic** - Default B2B CRM (base configuration)
2. **school** - School admissions and enrollment tracking
3. **custom** - Your custom industry (add as needed)

### Adding a New Industry Type

1. Create configuration file: `backend/src/config/industry/your_industry.config.js`
2. Register in configLoader.js
3. Update company's industry_type in database
4. Restart application

---

## Field Configuration

### Field Definition Structure

Every field has this structure:

```javascript
{
  // Unique identifier (used in code and forms)
  id: 'field_name',
  
  // Database column name (for core fields) or JSONB key (for custom fields)
  name: 'field_name',
  
  // Display label shown in UI
  label: 'Field Label',
  
  // Input type
  type: 'text', // see supported types below
  
  // Whether field is required
  required: false,
  
  // Is this a custom field (stored in custom_fields JSONB)?
  isCustomField: false,
  
  // Validation rules
  validation: {
    minLength: 2,
    maxLength: 50,
    pattern: '^[a-zA-Z\\s]+$',
    message: 'Custom error message',
    min: 0,      // for numbers
    max: 100     // for numbers
  },
  
  // UI properties
  uiProps: {
    placeholder: 'Enter value',
    helpText: 'Help text shown below field',
    gridColumn: 'col-span-6', // Tailwind grid classes
    showInList: true,    // Show in table/list views
    showInDetail: true,  // Show in detail view
    sortable: true,      // Enable sorting
    searchable: true,    // Include in search
    filterable: true     // Enable filtering
  },
  
  // Default value for new records
  defaultValue: '',
  
  // Options for select fields
  options: [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]
}
```

### Supported Field Types

| Type | Description | Example Use Case |
|------|-------------|------------------|
| `text` | Single-line text input | Names, titles |
| `email` | Email input with validation | Email addresses |
| `phone` | Phone number input | Contact numbers |
| `number` | Numeric input | Quantities, scores |
| `currency` | Money amount | Deal values |
| `date` | Date picker | Deadlines, birthdays |
| `datetime` | Date and time picker | Appointments |
| `textarea` | Multi-line text | Notes, descriptions |
| `select` | Dropdown with fixed options | Grade levels, categories |
| `picklist` | Dynamic dropdown from database | Lead sources, statuses |
| `user_select` | User assignment dropdown | Assigned to |
| `pipeline_stage` | Pipeline stage selector | Deal stages |
| `checkbox` | Boolean checkbox | Agreements, flags |

### Core Fields vs Custom Fields

**Core Fields:**
- Stored as database columns in `leads` table
- Examples: `first_name`, `last_name`, `email`, `phone`, `company`
- Set `isCustomField: false`
- Require database migration to add new ones

**Custom Fields:**
- Stored in `custom_fields` JSONB column
- No database changes needed to add/remove
- Set `isCustomField: true`
- Perfect for industry-specific data

**Example:**

```javascript
// Core field (database column)
firstName: {
  id: 'firstName',
  name: 'first_name',  // maps to leads.first_name
  label: 'First Name',
  type: 'text',
  required: true,
  isCustomField: false  // database column
},

// Custom field (JSONB storage)
studentGrade: {
  id: 'studentGrade',
  name: 'student_grade',  // maps to leads.custom_fields.student_grade
  label: 'Student Grade',
  type: 'select',
  required: false,
  isCustomField: true,  // stored in JSONB
  options: [
    { value: 'grade_1', label: 'Grade 1' },
    { value: 'grade_2', label: 'Grade 2' }
  ]
}
```

---

## Terminology Customization

### Why Terminology Matters

Different industries use different terms for the same concepts:
- **B2B Sales**: "Lead", "Deal", "Sales Pipeline"
- **Education**: "Prospective Student", "Enrollment", "Admission Pipeline"
- **Healthcare**: "Patient", "Treatment Plan", "Care Journey"
- **Real Estate**: "Prospect", "Listing", "Transaction Pipeline"

### Terminology Configuration

Edit the `terminology` section in your config:

```javascript
terminology: {
  // Singular and plural forms
  lead: 'Prospective Student',
  leads: 'Prospective Students',
  
  // Action verbs
  createLead: 'Add Student',
  editLead: 'Edit Student',
  deleteLead: 'Remove Student',
  
  // Related terms
  deal: 'Enrollment',
  dealValue: 'Tuition Amount',
  expectedCloseDate: 'Expected Enrollment Date',
  pipeline: 'Admission Pipeline',
  stage: 'Admission Stage',
  won: 'Enrolled',
  lost: 'Not Enrolled',
  assignedTo: 'Admission Counselor',
  
  // Contact fields
  contact: 'Parent/Guardian',
  company: 'Current School',
  
  // Other common terms
  source: 'Inquiry Source',
  status: 'Application Status',
  notes: 'Admission Notes'
}
```

### Using Terminology in Frontend

In React components, use the `TermLabel` component:

```jsx
import TermLabel from '../components/Common/TermLabel';

// Simple usage
<h1><TermLabel term="leads" /></h1>
// Renders: "Prospective Students" (for school) or "Leads" (for generic)

// In text
<p>Manage your <TermLabel term="leads" /></p>

// In buttons
<button>Add <TermLabel term="lead" /></button>
```

---

## Form Layout Design

### Section-Based Layouts

Forms are organized into collapsible sections for better UX:

```javascript
formLayout: {
  sections: [
    {
      id: 'personal_info',
      title: 'Personal Information',
      icon: 'user',  // optional icon identifier
      collapsible: true,
      defaultCollapsed: false,
      fields: ['firstName', 'lastName', 'email', 'phone']
    },
    {
      id: 'business_info',
      title: 'Business Information',
      collapsible: true,
      defaultCollapsed: false,
      fields: ['company', 'jobTitle', 'industry']
    },
    {
      id: 'admission_details',
      title: 'Admission Details',
      collapsible: true,
      defaultCollapsed: false,
      fields: ['gradeApplyingFor', 'enrollmentYear', 'tourDate']
    }
  ]
}
```

### Grid Layout Control

Use Tailwind CSS grid classes in `gridColumn` to control field widths:

```javascript
// Full width (12 columns)
gridColumn: 'col-span-12'

// Half width (6 columns)
gridColumn: 'col-span-6'

// One third (4 columns)
gridColumn: 'col-span-4'

// One fourth (3 columns)
gridColumn: 'col-span-3'

// Responsive: full on mobile, half on desktop
gridColumn: 'col-span-12 md:col-span-6'
```

**Example:**

```javascript
firstName: {
  // ...
  uiProps: {
    gridColumn: 'col-span-12 md:col-span-6' // Full width on mobile, half on desktop
  }
},

notes: {
  // ...
  uiProps: {
    gridColumn: 'col-span-12' // Always full width
  }
}
```

---

## Validation Rules

### Built-in Validation

All validation rules are configured in the field definition:

```javascript
{
  validation: {
    // String length
    minLength: 2,
    maxLength: 100,
    
    // Regex pattern
    pattern: '^[a-zA-Z\\s\\-\']+$',
    message: 'Only letters, spaces, hyphens, and apostrophes allowed',
    
    // Numeric ranges
    min: 0,
    max: 100,
    
    // Date ranges
    minDate: '2024-01-01',
    maxDate: '2025-12-31',
    
    // Custom validation function (backend only)
    customValidator: (value) => {
      // Return true if valid, false if invalid
      return value !== 'forbidden';
    }
  }
}
```

### Email and Phone Validation

Email and phone fields have built-in validation:

```javascript
email: {
  type: 'email',
  // Automatically validates email format
  validation: {
    pattern: '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$',
    message: 'Please enter a valid email address'
  }
},

phone: {
  type: 'phone',
  // Flexible international phone format
  validation: {
    pattern: '^[\\+]?[0-9\\s\\-\\(\\)]{0,20}$',
    message: 'Please enter a valid phone number'
  }
}
```

### Required Fields

```javascript
// Simple required
{
  required: true
}

// Conditionally required (requires custom logic)
{
  required: (formData) => {
    // Require email if phone is not provided
    return !formData.phone;
  }
}
```

### Global Validation Rules

Set application-wide validation rules:

```javascript
validation: {
  // Require at least one contact method (email or phone)
  requireContactMethod: true,
  
  // Prevent duplicate emails within company
  preventDuplicateEmail: true,
  
  // Custom status requirements
  statusRequirements: {
    qualified: ['email', 'phone'], // Require both for qualified status
    won: ['company', 'dealValue']  // Require these for won status
  }
}
```

---

## Pipeline Configuration

### Default Pipeline Stages

Define default stages for new companies:

```javascript
pipeline: {
  enabled: true,
  defaultStages: [
    {
      name: 'New Inquiry',
      color: '#3B82F6',  // Tailwind blue-500
      order: 1,
      isClosedWon: false,
      isClosedLost: false,
      description: 'Initial contact or inquiry'
    },
    {
      name: 'Qualified',
      color: '#10B981',  // Tailwind green-500
      order: 2,
      isClosedWon: false,
      isClosedLost: false,
      description: 'Prospect meets qualification criteria'
    },
    {
      name: 'Proposal Sent',
      color: '#F59E0B',  // Tailwind amber-500
      order: 3,
      isClosedWon: false,
      isClosedLost: false,
      description: 'Proposal or quote sent to prospect'
    },
    {
      name: 'Won',
      color: '#22C55E',  // Tailwind green-400
      order: 4,
      isClosedWon: true,
      isClosedLost: false,
      description: 'Deal closed successfully'
    },
    {
      name: 'Lost',
      color: '#EF4444',  // Tailwind red-500
      order: 5,
      isClosedWon: false,
      isClosedLost: true,
      description: 'Deal was not closed'
    }
  ],
  
  // Allow users to create custom stages
  allowCustomStages: true,
  
  // Enable drag-and-drop in Kanban view
  dragAndDrop: true,
  
  // Automatically move to next stage on status change
  autoProgressOnStatusChange: false
}
```

### Stage Colors

Use Tailwind color hex codes for consistent styling:

| Color Name | Hex Code | Use Case |
|-----------|----------|----------|
| Blue | #3B82F6 | New, Initial stages |
| Cyan | #06B6D4 | Active, In Progress |
| Green | #10B981 | Qualified, Positive |
| Yellow | #F59E0B | Pending, Waiting |
| Orange | #F97316 | Urgent, Important |
| Red | #EF4444 | Lost, Negative |
| Purple | #8B5CF6 | Special, Premium |
| Pink | #EC4899 | Follow-up, Review |

---

## Examples

### Example 1: Real Estate CRM

```javascript
// backend/src/config/industry/realestate.config.js
const baseConfig = require('./base.config');

module.exports = {
  ...baseConfig,
  
  industryType: 'realestate',
  industryName: 'Real Estate CRM',
  
  terminology: {
    ...baseConfig.terminology,
    lead: 'Prospect',
    leads: 'Prospects',
    deal: 'Listing',
    dealValue: 'Property Value',
    expectedCloseDate: 'Expected Closing Date',
    pipeline: 'Sales Pipeline',
    won: 'Sold',
    lost: 'Lost'
  },
  
  customFields: {
    propertyType: {
      id: 'propertyType',
      name: 'property_type',
      label: 'Property Type',
      type: 'select',
      required: true,
      isCustomField: true,
      options: [
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'land', label: 'Land' },
        { value: 'industrial', label: 'Industrial' }
      ],
      uiProps: {
        gridColumn: 'col-span-6'
      }
    },
    
    bedrooms: {
      id: 'bedrooms',
      name: 'bedrooms',
      label: 'Bedrooms',
      type: 'number',
      required: false,
      isCustomField: true,
      validation: {
        min: 0,
        max: 20
      },
      uiProps: {
        gridColumn: 'col-span-4'
      }
    },
    
    bathrooms: {
      id: 'bathrooms',
      name: 'bathrooms',
      label: 'Bathrooms',
      type: 'number',
      required: false,
      isCustomField: true,
      validation: {
        min: 0,
        max: 20
      },
      uiProps: {
        gridColumn: 'col-span-4'
      }
    },
    
    squareFeet: {
      id: 'squareFeet',
      name: 'square_feet',
      label: 'Square Feet',
      type: 'number',
      required: false,
      isCustomField: true,
      validation: {
        min: 0
      },
      uiProps: {
        gridColumn: 'col-span-4'
      }
    },
    
    propertyAddress: {
      id: 'propertyAddress',
      name: 'property_address',
      label: 'Property Address',
      type: 'textarea',
      required: false,
      isCustomField: true,
      uiProps: {
        gridColumn: 'col-span-12',
        rows: 3
      }
    }
  },
  
  formLayout: {
    sections: [
      {
        id: 'client_info',
        title: 'Client Information',
        fields: ['firstName', 'lastName', 'email', 'phone']
      },
      {
        id: 'property_details',
        title: 'Property Details',
        fields: ['propertyType', 'bedrooms', 'bathrooms', 'squareFeet', 'propertyAddress']
      },
      {
        id: 'deal_info',
        title: 'Deal Information',
        fields: ['dealValue', 'expectedCloseDate', 'status', 'assignedTo']
      }
    ]
  },
  
  pipeline: {
    defaultStages: [
      { name: 'New Prospect', color: '#3B82F6', order: 1 },
      { name: 'Viewing Scheduled', color: '#06B6D4', order: 2 },
      { name: 'Offer Made', color: '#F59E0B', order: 3 },
      { name: 'Under Contract', color: '#8B5CF6', order: 4 },
      { name: 'Sold', color: '#22C55E', order: 5, isClosedWon: true },
      { name: 'Lost', color: '#EF4444', order: 6, isClosedLost: true }
    ]
  }
};
```

### Example 2: Healthcare CRM (Patient Management)

```javascript
// backend/src/config/industry/healthcare.config.js
const baseConfig = require('./base.config');

module.exports = {
  ...baseConfig,
  
  industryType: 'healthcare',
  industryName: 'Healthcare CRM',
  
  terminology: {
    ...baseConfig.terminology,
    lead: 'Patient',
    leads: 'Patients',
    deal: 'Treatment Plan',
    dealValue: 'Treatment Cost',
    expectedCloseDate: 'Expected Start Date',
    pipeline: 'Care Journey',
    won: 'Treatment Started',
    lost: 'Not Proceeding'
  },
  
  customFields: {
    dateOfBirth: {
      id: 'dateOfBirth',
      name: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      required: true,
      isCustomField: true,
      uiProps: {
        gridColumn: 'col-span-6'
      }
    },
    
    insuranceProvider: {
      id: 'insuranceProvider',
      name: 'insurance_provider',
      label: 'Insurance Provider',
      type: 'text',
      required: false,
      isCustomField: true,
      uiProps: {
        gridColumn: 'col-span-6'
      }
    },
    
    insuranceId: {
      id: 'insuranceId',
      name: 'insurance_id',
      label: 'Insurance ID',
      type: 'text',
      required: false,
      isCustomField: true,
      uiProps: {
        gridColumn: 'col-span-6'
      }
    },
    
    referringPhysician: {
      id: 'referringPhysician',
      name: 'referring_physician',
      label: 'Referring Physician',
      type: 'text',
      required: false,
      isCustomField: true,
      uiProps: {
        gridColumn: 'col-span-6'
      }
    },
    
    medicalConditions: {
      id: 'medicalConditions',
      name: 'medical_conditions',
      label: 'Medical Conditions',
      type: 'textarea',
      required: false,
      isCustomField: true,
      uiProps: {
        gridColumn: 'col-span-12',
        rows: 3,
        helpText: 'List any relevant medical conditions or concerns'
      }
    },
    
    medications: {
      id: 'medications',
      name: 'medications',
      label: 'Current Medications',
      type: 'textarea',
      required: false,
      isCustomField: true,
      uiProps: {
        gridColumn: 'col-span-12',
        rows: 2
      }
    }
  },
  
  formLayout: {
    sections: [
      {
        id: 'patient_info',
        title: 'Patient Information',
        fields: ['firstName', 'lastName', 'dateOfBirth', 'email', 'phone']
      },
      {
        id: 'insurance_info',
        title: 'Insurance Information',
        fields: ['insuranceProvider', 'insuranceId']
      },
      {
        id: 'medical_info',
        title: 'Medical Information',
        fields: ['referringPhysician', 'medicalConditions', 'medications']
      },
      {
        id: 'care_details',
        title: 'Care Journey',
        fields: ['status', 'assignedTo', 'notes']
      }
    ]
  },
  
  pipeline: {
    defaultStages: [
      { name: 'Initial Contact', color: '#3B82F6', order: 1 },
      { name: 'Consultation Scheduled', color: '#06B6D4', order: 2 },
      { name: 'Consultation Complete', color: '#10B981', order: 3 },
      { name: 'Treatment Proposed', color: '#F59E0B', order: 4 },
      { name: 'Treatment Started', color: '#22C55E', order: 5, isClosedWon: true },
      { name: 'Not Proceeding', color: '#EF4444', order: 6, isClosedLost: true }
    ]
  }
};
```

---

## Troubleshooting

### Configuration Not Loading

**Problem:** Changes to config file not reflected in UI

**Solutions:**
1. **Restart backend server** - Configuration is cached on startup
2. **Clear browser cache** - Frontend may cache API responses
3. **Check company industry_type** - Verify database value matches config file name
4. **Check console for errors** - Look for config loading errors in backend logs

```bash
# Restart backend
cd backend
npm run dev

# Check company setting in database
# In Supabase SQL Editor:
SELECT id, name, industry_type FROM companies;
```

### Fields Not Showing

**Problem:** Custom fields not appearing in forms

**Solutions:**
1. **Check field is in formLayout** - Fields must be listed in a section
2. **Verify field ID matches** - The `id` in field definition must match name in formLayout
3. **Check isCustomField flag** - Ensure it's set correctly (true for JSONB fields)
4. **Validate field type** - Ensure type is one of the supported types

```javascript
// Common mistake: Field ID doesn't match
customFields: {
  myField: {  // ❌ Field ID is 'myField'
    name: 'my_field',
    // ...
  }
},
formLayout: {
  sections: [{
    fields: ['my_field']  // ❌ Using database name instead of ID
  }]
}

// Correct:
formLayout: {
  sections: [{
    fields: ['myField']  // ✅ Use field ID
  }]
}
```

### Validation Not Working

**Problem:** Form allows invalid data

**Solutions:**
1. **Check validation syntax** - Ensure validation object is correctly formatted
2. **Test regex patterns** - Use online regex tester to verify patterns
3. **Check backend validation** - Validation happens on both frontend and backend
4. **Review error messages** - Look for validation errors in browser console

### Custom Fields Not Saving

**Problem:** Custom fields data not persisted to database

**Solutions:**
1. **Verify database migration** - Ensure `custom_fields` JSONB column exists
2. **Check field names** - Custom field `name` values become JSONB keys
3. **Review backend logs** - Look for validation or save errors
4. **Test with simple field** - Try adding a basic text field to isolate issue

```javascript
// Simple test field
testField: {
  id: 'testField',
  name: 'test_field',
  label: 'Test Field',
  type: 'text',
  required: false,
  isCustomField: true
}
```

### Pipeline Stages Not Appearing

**Problem:** Custom pipeline stages not showing in dropdown

**Solutions:**
1. **Check pipeline configuration** - Verify defaultStages array is correctly formatted
2. **Run stage initialization** - May need to create stages in database first
3. **Check company_id** - Stages are company-specific
4. **Verify RLS policies** - Row Level Security must allow access

```sql
-- Check if stages exist
SELECT * FROM pipeline_stages WHERE company_id = 'your-company-id';

-- Create stages from configuration (run initialization script)
-- See backend/scripts/ for initialization helpers
```

### Terminology Not Changing

**Problem:** UI still shows "Lead" instead of custom term

**Solutions:**
1. **Check TermLabel usage** - Ensure using `<TermLabel term="leads" />` component
2. **Verify config loaded** - Check useIndustryConfig hook returns data
3. **Check term key** - Term key must match exactly (case-sensitive)
4. **Refresh page** - Browser may cache old terminology

```jsx
// Wrong: Hardcoded text
<h1>Leads</h1>

// Correct: Dynamic terminology
<h1><TermLabel term="leads" /></h1>
```

---

## Best Practices

### 1. Start with Base Configuration

Always extend base.config.js instead of starting from scratch:

```javascript
const baseConfig = require('./base.config');

module.exports = {
  ...baseConfig,  // Inherit everything from base
  
  // Override only what you need
  industryType: 'my_industry',
  terminology: {
    ...baseConfig.terminology,
    lead: 'My Custom Term'
  }
};
```

### 2. Use Descriptive Field Names

```javascript
// ❌ Bad: Ambiguous names
field1: { name: 'field1', label: 'Field 1' }

// ✅ Good: Clear, descriptive names
studentGrade: { name: 'student_grade', label: 'Student Grade' }
```

### 3. Group Related Fields

Organize fields into logical sections for better UX:

```javascript
formLayout: {
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      fields: ['firstName', 'lastName', 'email']
    },
    {
      id: 'preferences',
      title: 'Preferences',
      fields: ['preferredContact', 'newsletter']
    }
  ]
}
```

### 4. Provide Helpful UI Hints

```javascript
{
  label: 'Email Address',
  uiProps: {
    placeholder: 'example@domain.com',
    helpText: 'We will never share your email with third parties'
  }
}
```

### 5. Test with Real Data

Before deploying, test your configuration with realistic data:
- Create test leads with all field combinations
- Test validation rules with edge cases
- Verify form layouts on mobile devices
- Check terminology consistency across all pages

### 6. Document Your Customizations

Add comments to your configuration file:

```javascript
customFields: {
  // School-specific: Track which grade student is applying for
  gradeApplyingFor: {
    // ...
  },
  
  // Financial: Required for scholarship evaluation
  householdIncome: {
    // ...
  }
}
```

---

## Support

For questions or issues:
- **GitHub Issues**: https://github.com/your-org/sakha-crm/issues
- **Documentation**: Check PHASE_1_MODULAR_REFACTORING_PLAN.md for technical details
- **Examples**: See `school.config.js` for a complete working example

---

## Version History

- **v1.0** (Phase 1) - Initial configuration system
  - Custom fields support (JSONB)
  - Industry configurations
  - Dynamic form rendering
  - Terminology system
  - Backward compatibility maintained

---

**Last Updated:** 2024
**Maintained By:** Sakha CRM Development Team
