/**
 * Base CRM Configuration
 * This is the foundation configuration that all industry-specific configs extend.
 * Defines core fields, terminology, and behavior for a generic CRM.
 */

const baseConfig = {
  // Industry identifier
  industryType: 'generic',
  industryName: 'Generic CRM',

  // =====================================================
  // TERMINOLOGY - Labels for UI display
  // =====================================================
  terminology: {
    // Main entity names
    lead: 'Lead',
    leads: 'Leads',
    contact: 'Contact',
    contacts: 'Contacts',
    company: 'Company',
    companies: 'Companies',
    deal: 'Deal',
    deals: 'Deals',

    // Pipeline terminology
    pipeline: 'Pipeline',
    stage: 'Stage',
    stages: 'Stages',

    // Activity terminology
    activity: 'Activity',
    activities: 'Activities',
    note: 'Note',
    notes: 'Notes',
    task: 'Task',
    tasks: 'Tasks',

    // User terminology
    assignee: 'Assignee',
    owner: 'Owner',
    team: 'Team',

    // Action terminology
    convert: 'Convert to Contact',
    qualify: 'Qualify',
    disqualify: 'Disqualify',
    win: 'Mark as Won',
    lose: 'Mark as Lost',
  },

  // =====================================================
  // CORE FIELDS - Standard fields available in all industries
  // =====================================================
  coreFields: {
    // Personal Information
    firstName: {
      name: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s\-\'\.]+$/,
        message: 'First name can only contain letters, spaces, hyphens, apostrophes, and periods',
      },
      placeholder: 'Enter first name',
      helpText: 'Individual\'s first name',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
    },

    lastName: {
      name: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s\-\'\.]+$/,
        message: 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods',
      },
      placeholder: 'Enter last name',
      helpText: 'Individual\'s last name',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
    },

    email: {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validation: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
      },
      placeholder: 'email@example.com',
      helpText: 'Primary email address',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
      unique: true,
    },

    phone: {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      required: false,
      validation: {
        pattern: /^[\+]?[0-9\s\-\(\)A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/,
        message: 'Please enter a valid phone number',
      },
      placeholder: '+1 (555) 123-4567',
      helpText: 'Primary contact phone number',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: false,
      searchable: true,
    },

    // Lead Information
    source: {
      name: 'source',
      label: 'Lead Source',
      type: 'select',
      required: false,
      options: [
        { value: 'website', label: 'Website' },
        { value: 'referral', label: 'Referral' },
        { value: 'social_media', label: 'Social Media' },
        { value: 'email_campaign', label: 'Email Campaign' },
        { value: 'cold_call', label: 'Cold Call' },
        { value: 'event', label: 'Event/Trade Show' },
        { value: 'partner', label: 'Partner' },
        { value: 'other', label: 'Other' },
      ],
      placeholder: 'Select source',
      helpText: 'How did this lead find us?',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: true,
      searchable: false,
      filterable: true,
    },

    status: {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      validation: { required: true },
      options: [
        { value: 'new', label: 'New', color: '#3B82F6' },
        { value: 'contacted', label: 'Contacted', color: '#06B6D4' },
        { value: 'qualified', label: 'Qualified', color: '#10B981' },
        { value: 'unqualified', label: 'Unqualified', color: '#6B7280' },
        { value: 'converted', label: 'Converted', color: '#22C55E' },
        { value: 'lost', label: 'Lost', color: '#EF4444' },
      ],
      defaultValue: 'new',
      placeholder: 'Select status',
      helpText: 'Current lead status',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: true,
      searchable: false,
      filterable: true,
    },

    // Deal Information
    dealValue: {
      name: 'deal_value',
      label: 'Deal Value',
      type: 'currency',
      required: false,
      validation: {
        min: 0,
        max: 999999999,
      },
      currency: 'USD',
      placeholder: '0.00',
      helpText: 'Estimated deal value',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: true,
      searchable: false,
    },

    expectedCloseDate: {
      name: 'expected_close_date',
      label: 'Expected Close Date',
      type: 'date',
      required: false,
      validation: {
        minDate: 'today',
        message: 'Close date cannot be in the past',
      },
      placeholder: 'Select date',
      helpText: 'When do you expect to close this deal?',
      gridColumn: 'col-span-6',
      showInList: false,
      showInDetail: true,
      sortable: true,
      searchable: false,
    },

    // Assignment
    assignedTo: {
      name: 'assigned_to',
      label: 'Assigned To',
      type: 'user',
      required: false,
      placeholder: 'Select user',
      helpText: 'User responsible for this lead',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: true,
      searchable: false,
      filterable: true,
    },

    // Pipeline
    pipelineStage: {
      name: 'pipeline_stage_id',
      label: 'Pipeline Stage',
      type: 'pipeline_stage',
      required: false,
      placeholder: 'Select stage',
      helpText: 'Current stage in sales pipeline',
      gridColumn: 'col-span-6',
      showInList: true,
      showInDetail: true,
      sortable: false,
      searchable: false,
      filterable: true,
    },

    // Notes
    notes: {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      validation: {
        maxLength: 1000,
      },
      rows: 4,
      placeholder: 'Add notes about this lead...',
      helpText: 'Internal notes about this lead',
      gridColumn: 'col-span-12',
      showInList: false,
      showInDetail: true,
      sortable: false,
      searchable: true,
    },
  },

  // =====================================================
  // CUSTOM FIELDS - Industry-specific fields stored in JSONB
  // These are empty in base config, overridden by industry configs
  // =====================================================
  customFields: {},

  // =====================================================
  // FORM LAYOUT - Define how fields appear in forms
  // =====================================================
  formLayout: {
    sections: [
      {
        id: 'personal_info',
        title: 'Personal Information',
        icon: 'user',
        fields: ['firstName', 'lastName', 'email', 'phone'],
        collapsible: false,
        defaultExpanded: true,
      },
      {
        id: 'lead_info',
        title: 'Lead Information',
        icon: 'info',
        fields: ['source', 'status', 'assignedTo', 'pipelineStage'],
        collapsible: false,
        defaultExpanded: true,
      },
      {
        id: 'deal_info',
        title: 'Deal Information',
        icon: 'currency',
        fields: ['dealValue', 'expectedCloseDate'],
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: 'additional_info',
        title: 'Additional Information',
        icon: 'notes',
        fields: ['notes'],
        collapsible: true,
        defaultExpanded: false,
      },
    ],
  },

  // =====================================================
  // LIST VIEW - Define how leads appear in lists/tables
  // =====================================================
  listView: {
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'source', 'status', 'assignedTo', 'dealValue'],
    defaultSort: { field: 'created_at', direction: 'desc' },
    rowsPerPage: 25,
    enableSearch: true,
    enableFilters: true,
    enableExport: true,
    enableBulkActions: true,
  },

  // =====================================================
  // PIPELINE CONFIGURATION
  // =====================================================
  pipeline: {
    enabled: true,
    defaultStages: [
      { name: 'New Lead', color: '#3B82F6', order: 1, isClosedWon: false, isClosedLost: false },
      { name: 'Contacted', color: '#06B6D4', order: 2, isClosedWon: false, isClosedLost: false },
      { name: 'Qualified', color: '#10B981', order: 3, isClosedWon: false, isClosedLost: false },
      { name: 'Proposal Sent', color: '#F59E0B', order: 4, isClosedWon: false, isClosedLost: false },
      { name: 'Negotiation', color: '#F97316', order: 5, isClosedWon: false, isClosedLost: false },
      { name: 'Closed Won', color: '#22C55E', order: 6, isClosedWon: true, isClosedLost: false },
      { name: 'Closed Lost', color: '#EF4444', order: 7, isClosedWon: false, isClosedLost: true },
    ],
    allowCustomStages: true,
    dragAndDrop: true,
  },

  // =====================================================
  // VALIDATION RULES - Applied to all leads
  // =====================================================
  validation: {
    // Require email OR phone (at least one contact method)
    requireContactMethod: true,

    // Prevent duplicate emails within company
    preventDuplicateEmail: true,

    // Automatically set status to 'qualified' when deal value > 0
    autoQualifyWithDealValue: false,

    // Required fields for status changes
    statusRequirements: {
      qualified: ['email', 'phone', 'assignedTo'],
      converted: ['dealValue', 'pipelineStage'],
    },
  },

  // =====================================================
  // AUTOMATION - Automatic actions
  // =====================================================
  automation: {
    // Auto-assign leads based on rules
    autoAssignment: {
      enabled: false,
      rules: [],
    },

    // Auto-update pipeline stage based on status
    autoPipelineUpdate: {
      enabled: true,
      mappings: {
        new: 'New Lead',
        contacted: 'Contacted',
        qualified: 'Qualified',
        converted: 'Closed Won',
        lost: 'Closed Lost',
      },
    },

    // Send notifications
    notifications: {
      onLeadCreated: true,
      onLeadAssigned: true,
      onStatusChange: true,
      onDealValueChange: true,
    },
  },

  // =====================================================
  // INTEGRATIONS - External system integration points
  // =====================================================
  integrations: {
    email: {
      enabled: false,
      provider: null,
      settings: {},
    },
    calendar: {
      enabled: false,
      provider: null,
      settings: {},
    },
    telephony: {
      enabled: false,
      provider: null,
      settings: {},
    },
  },

  // =====================================================
  // REPORTS - Available report types
  // =====================================================
  reports: {
    available: [
      { id: 'lead_source', name: 'Leads by Source', type: 'pie' },
      { id: 'lead_status', name: 'Leads by Status', type: 'bar' },
      { id: 'pipeline_stage', name: 'Pipeline Analysis', type: 'funnel' },
      { id: 'deal_value', name: 'Deal Value Analysis', type: 'bar' },
      { id: 'conversion_rate', name: 'Conversion Rate', type: 'line' },
      { id: 'user_performance', name: 'User Performance', type: 'table' },
    ],
  },

  // =====================================================
  // PERMISSIONS - Role-based field access
  // =====================================================
  permissions: {
    sales_rep: {
      canView: ['all'],
      canEdit: ['all'],
      canDelete: false,
      restrictToAssigned: true,
    },
    manager: {
      canView: ['all'],
      canEdit: ['all'],
      canDelete: true,
      restrictToAssigned: false,
    },
    admin: {
      canView: ['all'],
      canEdit: ['all'],
      canDelete: true,
      restrictToAssigned: false,
    },
  },
};

module.exports = baseConfig;