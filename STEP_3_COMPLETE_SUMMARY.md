# 📋 Step 3 Plan: Dynamic Frontend Components

**Phase 1 Progress**: Step 3 of 8 - Ready to Execute
**Status**: ⏳ Pending Implementation
**Estimated Time**: 3-4 hours
**Complexity**: Medium-High

---

## 🎯 What Will Be Created

Step 3 will build the React components needed to consume the backend configuration system and render dynamic, industry-configurable forms.

### 📁 Files to Create

#### 1. **Industry Configuration Context**
```
frontend/src/context/IndustryConfigContext.jsx
```
- React Context to provide configuration to all components
- Fetches configuration from backend on mount
- Caches configuration in state
- Provides helper functions to access config data
- **Lines of Code:** ~150

#### 2. **Dynamic Form Field Component**
```
frontend/src/components/Forms/DynamicFormField.jsx
```
- Renders any field type based on configuration
- Supports: text, email, tel, number, date, datetime, select, multiselect, textarea, checkbox, currency
- Automatic validation based on field definition
- Responsive grid layout from config
- **Lines of Code:** ~300

#### 3. **Term Label Component**
```
frontend/src/components/Common/TermLabel.jsx
```
- Displays industry-specific terminology
- Replaces hardcoded "Lead" with "Prospective Student" (for schools)
- Supports singular/plural forms
- Simple wrapper component
- **Lines of Code:** ~40

#### 4. **Dynamic Lead Form**
```
frontend/src/components/Forms/DynamicLeadForm.jsx
```
- Replaces existing hardcoded LeadForm
- Renders form sections from configuration
- Handles custom fields automatically
- Collapsible sections
- Full create/edit support
- **Lines of Code:** ~400

#### 5. **Configuration Loading Component**
```
frontend/src/components/Common/ConfigLoader.jsx
```
- Shows loading state while fetching config
- Handles configuration errors
- Retry mechanism
- **Lines of Code:** ~80

### 📁 Files to Update

#### 1. **App Provider Wrapper**
```
frontend/src/App.jsx (UPDATE)
```
- Wrap app with IndustryConfigProvider
- Ensure config loads before rendering routes

#### 2. **Lead List Page**
```
frontend/src/pages/Leads.jsx (UPDATE)
```
- Use TermLabel for page titles
- Replace LeadForm with DynamicLeadForm
- Update column headers with terminology

#### 3. **Lead Service**
```
frontend/src/services/leadService.js (UPDATE)
```
- Add endpoint to fetch configuration
- Include custom_fields in API requests

---

## 🏗️ Architecture Overview

### Component Hierarchy

```
App
├── IndustryConfigProvider         ← NEW: Provides config to all children
│   ├── AuthProvider
│   │   ├── Router
│   │   │   ├── Leads Page         ← UPDATED: Uses TermLabel, DynamicLeadForm
│   │   │   │   ├── TermLabel      ← NEW: "Leads" or "Prospective Students"
│   │   │   │   └── DynamicLeadForm ← NEW: Renders based on config
│   │   │   │       ├── FormSection
│   │   │   │       └── DynamicFormField ← NEW: Renders any field type
│   │   │   ├── Dashboard          ← UPDATED: Uses TermLabel
│   │   │   └── Pipeline           ← UPDATED: Uses TermLabel
```

### Data Flow

```
1. App Mounts
   └─> IndustryConfigProvider fetches GET /api/config/industry
       └─> Stores config in context state
           └─> All child components can access config

2. User Opens Lead Form
   └─> DynamicLeadForm reads config from context
       └─> Renders sections from config.formLayout
           └─> Each section renders DynamicFormField for each field
               └─> DynamicFormField reads field definition from config
                   └─> Renders appropriate input type (text/select/date/etc)

3. User Submits Form
   └─> DynamicLeadForm collects all field values
       └─> Separates core fields and custom fields
           └─> Sends to backend: { ...coreFields, custom_fields: {...} }
               └─> Backend validates and stores
```

---

## 📝 Detailed Implementation Plan

### Phase 1: Context Setup (45 min)

#### 1.1 Create IndustryConfigContext

**File:** `frontend/src/context/IndustryConfigContext.jsx`

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const IndustryConfigContext = createContext(null);

export const IndustryConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/industry');
      setConfig(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getTerm = (key, plural = false) => {
    if (!config?.config?.terminology) return key;
    const term = config.config.terminology[key];
    return plural && term ? `${term}s` : term || key;
  };

  const getFieldDefinition = (fieldName) => {
    const allFields = {
      ...config?.config?.coreFields,
      ...config?.config?.customFields
    };
    return allFields[fieldName];
  };

  const getFormLayout = () => {
    return config?.config?.formLayout?.sections || [];
  };

  const value = {
    config: config?.config,
    company: config?.company,
    loading,
    error,
    refetch: fetchConfig,
    // Helper functions
    getTerm,
    getFieldDefinition,
    getFormLayout
  };

  return (
    <IndustryConfigContext.Provider value={value}>
      {children}
    </IndustryConfigContext.Provider>
  );
};

export const useIndustryConfig = () => {
  const context = useContext(IndustryConfigContext);
  if (!context) {
    throw new Error('useIndustryConfig must be used within IndustryConfigProvider');
  }
  return context;
};
```

**Key Features:**
- Fetches config on mount
- Provides helper functions (getTerm, getFieldDefinition, getFormLayout)
- Error handling and loading states
- Refetch capability

#### 1.2 Update App.jsx

**File:** `frontend/src/App.jsx`

```jsx
import { IndustryConfigProvider } from './context/IndustryConfigContext';

function App() {
  return (
    <IndustryConfigProvider>
      <AuthProvider>
        {/* existing router code */}
      </AuthProvider>
    </IndustryConfigProvider>
  );
}
```

---

### Phase 2: Basic Components (1 hour)

#### 2.1 Create TermLabel Component

**File:** `frontend/src/components/Common/TermLabel.jsx`

```jsx
import React from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';

/**
 * Display industry-specific terminology
 * Examples:
 *   <TermLabel term="lead" /> → "Lead" or "Prospective Student"
 *   <TermLabel term="lead" plural /> → "Leads" or "Prospective Students"
 */
const TermLabel = ({ term, plural = false, className = '' }) => {
  const { getTerm, loading } = useIndustryConfig();

  if (loading) {
    return <span className={className}>{term}</span>;
  }

  const label = getTerm(term, plural);

  return <span className={className}>{label}</span>;
};

export default TermLabel;
```

**Usage:**
```jsx
// Before (hardcoded):
<h1>Leads</h1>

// After (dynamic):
<h1><TermLabel term="leads" /></h1>
// Renders: "Leads" for generic, "Prospective Students" for school
```

#### 2.2 Create ConfigLoader Component

**File:** `frontend/src/components/Common/ConfigLoader.jsx`

```jsx
import React from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';

/**
 * Show loading state while configuration loads
 * Wraps children and only renders when config is ready
 */
const ConfigLoader = ({ children, fallback = null }) => {
  const { loading, error, refetch } = useIndustryConfig();

  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading configuration...</p>
          </div>
        </div>
      )
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load configuration</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ConfigLoader;
```

---

### Phase 3: Dynamic Form Field (1.5 hours)

#### 3.1 Create DynamicFormField Component

**File:** `frontend/src/components/Forms/DynamicFormField.jsx`

This is the most complex component - renders any field type based on config.

```jsx
import React from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';

/**
 * Renders a form field based on configuration
 * Supports all field types defined in industry configs
 */
const DynamicFormField = ({
  fieldName,
  value,
  onChange,
  errors = {},
  disabled = false
}) => {
  const { getFieldDefinition } = useIndustryConfig();
  const field = getFieldDefinition(fieldName);

  if (!field) {
    console.warn(`Field definition not found for: ${fieldName}`);
    return null;
  }

  const hasError = !!errors[field.name];
  const errorMessage = errors[field.name];

  const inputClasses = `
    mt-1 block w-full rounded-md shadow-sm
    ${hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
  `;

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(field.name, newValue);
  };

  const handleCheckboxChange = (e) => {
    onChange(field.name, e.target.checked);
  };

  const handleMultiSelectChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    onChange(field.name, options);
  };

  // Render different input types
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return renderTextInput();

    case 'number':
    case 'currency':
      return renderNumberInput();

    case 'date':
    case 'datetime':
      return renderDateInput();

    case 'select':
      return renderSelectInput();

    case 'multiselect':
      return renderMultiSelectInput();

    case 'textarea':
      return renderTextarea();

    case 'checkbox':
      return renderCheckbox();

    default:
      return renderTextInput();
  }

  function renderTextInput() {
    return (
      <div className={field.gridColumn || 'col-span-12'}>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={field.type}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          maxLength={field.maxLength}
          className={inputClasses}
        />
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }

  function renderNumberInput() {
    return (
      <div className={field.gridColumn || 'col-span-12'}>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="number"
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.type === 'currency' ? '0.01' : '1'}
          className={inputClasses}
        />
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }

  function renderDateInput() {
    return (
      <div className={field.gridColumn || 'col-span-12'}>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={field.type === 'datetime' ? 'datetime-local' : 'date'}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          required={field.required}
          className={inputClasses}
        />
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }

  function renderSelectInput() {
    return (
      <div className={field.gridColumn || 'col-span-12'}>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          required={field.required}
          className={inputClasses}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }

  function renderMultiSelectInput() {
    return (
      <div className={field.gridColumn || 'col-span-12'}>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          name={field.name}
          value={value || []}
          onChange={handleMultiSelectChange}
          disabled={disabled}
          required={field.required}
          multiple
          className={`${inputClasses} h-32`}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Hold Ctrl/Cmd to select multiple
        </p>
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }

  function renderTextarea() {
    return (
      <div className={field.gridColumn || 'col-span-12'}>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          maxLength={field.maxLength}
          rows={field.rows || 4}
          className={inputClasses}
        />
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }

  function renderCheckbox() {
    return (
      <div className={field.gridColumn || 'col-span-12'}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              name={field.name}
              checked={value || false}
              onChange={handleCheckboxChange}
              disabled={disabled}
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-gray-500">{field.helpText}</p>
            )}
          </div>
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600 ml-7">{errorMessage}</p>
        )}
      </div>
    );
  }
};

export default DynamicFormField;
```

**Key Features:**
- Renders all field types from config
- Automatic validation display
- Grid layout from config
- Help text and placeholders
- Error handling
- Disabled state support

---

### Phase 4: Dynamic Lead Form (1.5 hours)

#### 4.1 Create DynamicLeadForm Component

**File:** `frontend/src/components/Forms/DynamicLeadForm.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';
import DynamicFormField from './DynamicFormField';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

/**
 * Dynamic lead form that renders based on industry configuration
 * Replaces hardcoded LeadForm with config-driven version
 */
const DynamicLeadForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const { getFormLayout, config } = useIndustryConfig();
  const [formData, setFormData] = useState({});
  const [customFields, setCustomFields] = useState({});
  const [errors, setErrors] = useState({});
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  useEffect(() => {
    if (initialData) {
      // Separate core fields and custom fields
      const { custom_fields, ...coreFields } = initialData;
      setFormData(coreFields);
      setCustomFields(custom_fields || {});
    }
  }, [initialData]);

  const formLayout = getFormLayout();

  const handleFieldChange = (fieldName, value) => {
    // Determine if this is a core field or custom field
    const isCustomField = config?.customFields?.[fieldName];

    if (isCustomField) {
      setCustomFields(prev => ({ ...prev, [fieldName]: value }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }

    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    formLayout.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          const isCustomField = config?.customFields?.[field.fieldName];
          const value = isCustomField
            ? customFields[field.name]
            : formData[field.name];

          if (!value || value === '') {
            newErrors[field.name] = `${field.label} is required`;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Combine core fields and custom fields
    const submitData = {
      ...formData,
      custom_fields: customFields
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formLayout.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        const shouldShowCollapse = section.collapsible !== false;

        return (
          <div key={section.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div
              className={`px-6 py-4 bg-gray-50 border-b border-gray-200 ${
                shouldShowCollapse ? 'cursor-pointer hover:bg-gray-100' : ''
              }`}
              onClick={() => shouldShowCollapse && toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {section.title}
                </h3>
                {shouldShowCollapse && (
                  <button type="button" className="text-gray-400 hover:text-gray-600">
                    {isCollapsed ? (
                      <ChevronDownIcon className="h-5 w-5" />
                    ) : (
                      <ChevronUpIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Section Content */}
            {!isCollapsed && (
              <div className="px-6 py-4">
                <div className="grid grid-cols-12 gap-4">
                  {section.fields.map((field) => {
                    const isCustomField = config?.customFields?.[field.fieldName];
                    const value = isCustomField
                      ? customFields[field.name]
                      : formData[field.name];

                    return (
                      <DynamicFormField
                        key={field.fieldName}
                        fieldName={field.fieldName}
                        value={value}
                        onChange={handleFieldChange}
                        errors={errors}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default DynamicLeadForm;
```

**Key Features:**
- Renders form sections from configuration
- Collapsible sections
- Automatic field rendering with DynamicFormField
- Separates core fields and custom fields
- Validation based on field requirements
- Grid layout from configuration
- Works for both create and edit modes

---

### Phase 5: Update Existing Pages (30 min)

#### 5.1 Update Leads Page

**File:** `frontend/src/pages/Leads.jsx`

```jsx
// Add imports
import TermLabel from '../components/Common/TermLabel';
import DynamicLeadForm from '../components/Forms/DynamicLeadForm';
import ConfigLoader from '../components/Common/ConfigLoader';

// Replace hardcoded titles
<h1>
  <TermLabel term="leads" />
</h1>

// Replace button text
<button>
  Create <TermLabel term="lead" />
</button>

// Replace LeadForm with DynamicLeadForm
<DynamicLeadForm
  initialData={selectedLead}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isEdit={!!selectedLead}
/>

// Wrap main content with ConfigLoader
<ConfigLoader>
  {/* existing page content */}
</ConfigLoader>
```

#### 5.2 Update Lead Service

**File:** `frontend/src/services/leadService.js`

```javascript
// Add configuration fetching
export const fetchIndustryConfig = async () => {
  try {
    const response = await api.get('/config/industry');
    return response.data;
  } catch (error) {
    console.error('Error fetching industry config:', error);
    throw error;
  }
};

// Ensure custom_fields included in create/update
export const createLead = async (leadData) => {
  try {
    const response = await api.post('/leads', {
      ...leadData,
      custom_fields: leadData.custom_fields || {}
    });
    return response.data;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};
```

---

## 🧪 Testing Checklist

### Manual Testing Steps

#### Test 1: Configuration Loading
- [ ] Open browser dev console
- [ ] Navigate to Leads page
- [ ] Check console for: "Loaded [industry] config from cache" or similar
- [ ] Verify no errors in console

#### Test 2: Terminology Display
- [ ] For generic company: Page shows "Leads"
- [ ] For school company: Page shows "Prospective Students"
- [ ] Update company industry_type in database and refresh
- [ ] Verify terminology changes

#### Test 3: Dynamic Form Rendering
- [ ] Click "Create Lead" button
- [ ] Verify form sections match configuration
- [ ] For school: Check "Student Information", "Parent Information" sections appear
- [ ] For generic: Check standard "Personal Information" sections appear

#### Test 4: Field Types
- [ ] Text fields render with proper placeholders
- [ ] Select fields show dropdown with configured options
- [ ] Date fields show date picker
- [ ] Number fields accept only numbers
- [ ] Checkbox fields toggle on/off
- [ ] Required fields show asterisk (*)

#### Test 5: Collapsible Sections
- [ ] Click section headers to collapse/expand
- [ ] Verify collapsed sections hide content
- [ ] Verify sections remember state during form session

#### Test 6: Form Validation
- [ ] Leave required field empty
- [ ] Submit form
- [ ] Verify error message appears under field
- [ ] Fill required field
- [ ] Verify error disappears

#### Test 7: Create Lead with Custom Fields
- [ ] Fill out form including custom fields
- [ ] Submit form
- [ ] Check network tab: Verify custom_fields in request body
- [ ] Check database: Verify custom_fields stored in JSONB
- [ ] View created lead: Verify custom fields display

#### Test 8: Edit Lead with Custom Fields
- [ ] Open existing lead for editing
- [ ] Verify custom fields populate correctly
- [ ] Modify some custom fields
- [ ] Submit form
- [ ] Verify only modified fields updated
- [ ] Verify other custom fields preserved

#### Test 9: Multiple Industries
- [ ] Create test company with industry_type = 'generic'
- [ ] Login as user from generic company
- [ ] Verify generic form appears
- [ ] Create test company with industry_type = 'school'
- [ ] Login as user from school company
- [ ] Verify school form appears

#### Test 10: Error Handling
- [ ] Disconnect from internet (or block API)
- [ ] Try to load Leads page
- [ ] Verify "Failed to load configuration" appears
- [ ] Click "Retry" button
- [ ] Verify config loads after reconnection

---

## 📊 Expected Results

### Configuration Loading

**Console Output:**
```
[CONFIG] Fetching industry configuration...
[CONFIG] Configuration loaded successfully
{
  company: { id: "...", name: "Example School", industry_type: "school" },
  config: { industryType: "school", ... }
}
```

### Form Rendering (School)

**Sections Rendered:**
1. Student Information (4 fields)
2. Admission Details (6 fields)
3. Parent/Guardian Information (7 fields)
4. Academic Background (4 fields)
5. Interests & Activities (2 fields)
6. Tour & Visit (2 fields)
7. Application Status (3 fields)
8. Financial Information (4 fields)
9. Additional Notes (1 field)

**Total Fields:** ~33 fields (11 core + 22 custom)

### API Request (Create Lead)

```json
POST /api/leads
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "parent@example.com",
  "phone": "+1 (555) 123-4567",
  "status": "new_inquiry",
  "source": "website",
  "custom_fields": {
    "student_age": 10,
    "grade_applying_for": "grade_5",
    "enrollment_year": "2025",
    "parent_name": "Jane Smith",
    "tour_completed": false,
    "application_received": true
  }
}
```

---

## 🎯 Success Criteria

After Step 3, you should be able to:

- ✅ Open Leads page and see industry-specific terminology
- ✅ Click "Create Lead" and see dynamic form based on configuration
- ✅ See different forms for different industry types
- ✅ Create leads with custom fields specific to industry
- ✅ Edit leads and preserve custom fields
- ✅ See configuration loading state
- ✅ Handle configuration errors gracefully
- ✅ Validate form fields based on configuration
- ✅ Collapse/expand form sections
- ✅ Switch between companies and see different configurations

---

## 🔧 Troubleshooting Guide

### Form Not Rendering

**Problem:** DynamicLeadForm shows blank

**Debug Steps:**
```javascript
// Add to DynamicLeadForm.jsx
console.log('Form layout:', getFormLayout());
console.log('Config:', config);

// Check for:
// - Empty formLayout array
// - Missing config
// - Context not loaded
```

### Fields Not Showing

**Problem:** Some fields missing from form

**Debug Steps:**
```javascript
// Check field definitions exist
console.log('All fields:', config?.coreFields, config?.customFields);

// Check section field references
formLayout.forEach(section => {
  console.log(`Section ${section.id}:`, section.fields);
});
```

### Custom Fields Not Saving

**Problem:** Custom fields empty in database

**Debug Steps:**
```javascript
// In handleSubmit
console.log('Form data:', formData);
console.log('Custom fields:', customFields);
console.log('Submit data:', submitData);

// Check:
// - customFields object populated
// - Included in submitData
// - Sent in API request
```

### Terminology Not Updating

**Problem:** Still shows "Leads" instead of "Prospective Students"

**Debug Steps:**
```javascript
// In TermLabel component
console.log('Term requested:', term);
console.log('Config terminology:', config?.terminology);
console.log('Resolved term:', getTerm(term));

// Check:
// - Configuration loaded
// - Terminology in config
// - getTerm function working
```

---

## 💡 Best Practices

### 1. Use ConfigLoader for Pages

Wrap pages that depend on configuration:
```jsx
<ConfigLoader>
  <LeadsPage />
</ConfigLoader>
```

### 2. Access Config via Hook

Always use the hook:
```jsx
const { config, getTerm, getFieldDefinition } = useIndustryConfig();
```

### 3. Separate Core and Custom Fields

Keep them organized:
```javascript
const coreFields = { first_name, last_name, email };
const customFields = { grade_applying_for, student_age };
```

### 4. Validate Before Submit

Check required fields:
```javascript
const validateForm = () => {
  // Check all required fields from config
};
```

### 5. Handle Loading States

Show loaders while config fetches:
```jsx
{loading ? <Spinner /> : <Form />}
```

---

## 📝 Code Quality Checklist

- [ ] All components use PropTypes or TypeScript
- [ ] Error boundaries around dynamic components
- [ ] Loading states for async operations
- [ ] Accessible form labels and ARIA attributes
- [ ] Responsive design (mobile-friendly)
- [ ] Console logs removed (or debug-only)
- [ ] Comments for complex logic
- [ ] Consistent naming conventions
- [ ] Reusable components extracted
- [ ] Performance optimized (useMemo/useCallback where needed)

---

## 🚀 Deployment Notes

### Build Process

```bash
# Frontend build
cd frontend
npm run build

# Check build size
du -sh dist/

# Expected size: ~500KB (gzipped)
```

### Environment Variables

No new environment variables needed. Uses existing API base URL.

### Cache Considerations

Configuration cached in React context - reloads on page refresh. Consider adding:
- LocalStorage caching (optional enhancement)
- Service worker caching (PWA)

---

## 🎉 What Happens Next

After Step 3 completes:

### Step 4: App Provider Integration (15 min)
- Ensure IndustryConfigProvider wraps entire app
- Test configuration loading on app startup

### Step 5: Documentation (1 hour)
- Create CONFIGURATION_GUIDE.md
- Document how to add new industries
- Provide examples for common scenarios

### Step 6: Testing (2 hours)
- Unit tests for components
- Integration tests for form submission
- E2E tests for full workflows

### Step 7: Performance Optimization (1 hour)
- Profile component rendering
- Optimize re-renders
- Add loading skeletons

### Step 8: Final Deployment
- Deploy to production
- Monitor for errors
- Gather user feedback

---

**Status**: 📋 Ready to Execute
**Estimated Time**: 3-4 hours
**Prerequisites**: ✅ Step 1 Complete, ✅ Step 2 Complete
**Next Step**: Start with Phase 1 (Context Setup)
