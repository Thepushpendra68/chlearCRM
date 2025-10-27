/**
 * School CRM Configuration
 * Extends base configuration with school-specific fields and terminology.
 * Use this for schools, colleges, universities, and educational institutions.
 */

const baseConfig = require('./base.config');

const schoolConfig = {
  ...baseConfig,

  // Override industry identifier
  industryType: 'school',
  industryName: 'School/Education CRM',

  // =====================================================
  // TERMINOLOGY - School-specific labels
  // =====================================================
  terminology: {
    ...baseConfig.terminology,
    // Override lead-related terms
    lead: 'Prospective Student',
    leads: 'Prospective Students',
    contact: 'Parent/Guardian',
    contacts: 'Parents/Guardians',
    deal: 'Enrollment',
    deals: 'Enrollments',

    // Override pipeline terms
    pipeline: 'Admission Pipeline',
    stage: 'Admission Stage',
    stages: 'Admission Stages',

    // Override action terms
    convert: 'Enroll Student',
    qualify: 'Qualify for Admission',
    win: 'Mark as Enrolled',
    lose: 'Mark as Not Enrolled',

    // School-specific terms
    student: 'Student',
    parent: 'Parent',
    guardian: 'Guardian',
    admission: 'Admission',
    enrollment: 'Enrollment',
    grade: 'Grade',
    academic_year: 'Academic Year',
  },

  // =====================================================
  // CORE FIELDS - Override labels for school context
  // =====================================================
  coreFields: {
    ...baseConfig.coreFields,

    // Update firstName to be student's first name
    firstName: {
      ...baseConfig.coreFields.firstName,
      label: 'Student First Name',
      helpText: 'Student\'s first name',
    },

    lastName: {
      ...baseConfig.coreFields.lastName,
      label: 'Student Last Name',
      helpText: 'Student\'s last name',
    },

    email: {
      ...baseConfig.coreFields.email,
      label: 'Parent Email',
      helpText: 'Primary parent/guardian email address',
      placeholder: 'parent@example.com',
    },

    phone: {
      ...baseConfig.coreFields.phone,
      label: 'Parent Phone',
      helpText: 'Primary parent/guardian phone number',
    },

    source: {
      ...baseConfig.coreFields.source,
      label: 'Inquiry Source',
      options: [
        { value: 'website', label: 'School Website' },
        { value: 'referral', label: 'Parent Referral' },
        { value: 'social_media', label: 'Social Media' },
        { value: 'open_house', label: 'Open House' },
        { value: 'advertisement', label: 'Advertisement' },
        { value: 'walk_in', label: 'Walk-in Inquiry' },
        { value: 'school_fair', label: 'School Fair/Event' },
        { value: 'phone_inquiry', label: 'Phone Inquiry' },
        { value: 'other', label: 'Other' },
      ],
      helpText: 'How did the parent find our school?',
    },

    status: {
      ...baseConfig.coreFields.status,
      label: 'Admission Status',
      options: [
        { value: 'new_inquiry', label: 'New Inquiry', color: '#3B82F6' },
        { value: 'tour_scheduled', label: 'Tour Scheduled', color: '#06B6D4' },
        { value: 'tour_completed', label: 'Tour Completed', color: '#8B5CF6' },
        { value: 'application_submitted', label: 'Application Submitted', color: '#F59E0B' },
        { value: 'documents_pending', label: 'Documents Pending', color: '#F97316' },
        { value: 'interview_scheduled', label: 'Interview Scheduled', color: '#10B981' },
        { value: 'offer_sent', label: 'Offer Sent', color: '#22C55E' },
        { value: 'enrolled', label: 'Enrolled', color: '#22C55E' },
        { value: 'waitlisted', label: 'Waitlisted', color: '#FCD34D' },
        { value: 'rejected', label: 'Rejected', color: '#EF4444' },
        { value: 'withdrawn', label: 'Withdrawn', color: '#6B7280' },
      ],
      defaultValue: 'new_inquiry',
      helpText: 'Current admission status',
    },

    dealValue: {
      ...baseConfig.coreFields.dealValue,
      label: 'Annual Tuition',
      helpText: 'Expected annual tuition fee',
      currency: 'USD',
    },

    expectedCloseDate: {
      ...baseConfig.coreFields.expectedCloseDate,
      label: 'Expected Enrollment Date',
      helpText: 'When do you expect the student to enroll?',
    },

    assignedTo: {
      ...baseConfig.coreFields.assignedTo,
      label: 'Admission Counselor',
      helpText: 'Counselor assigned to this prospective student',
    },

    pipelineStage: {
      ...baseConfig.coreFields.pipelineStage,
      label: 'Admission Stage',
      helpText: 'Current stage in admission process',
    },
  },

  // =====================================================
  // CUSTOM FIELDS - School-specific fields stored in JSONB
  // =====================================================
  customFields: {
    // Student Information
    studentAge: {
      name: 'student_age',
      label: 'Student Age',
      type: 'number',
      required: false,
      validation: { min: 2, max: 25 },
      placeholder: 'Enter age',
      helpText: 'Student\'s current age',
      gridColumn: 'col-span-3',
      showInList: true,
      showInDetail: true,
      category: 'student_info',
    },

    studentDateOfBirth: {
      name: 'student_dob',
      label: 'Date of Birth',
      type: 'date',
      required: false,
      validation: {
        maxDate: 'today',
        message: 'Birth date cannot be in the future',
      },
      placeholder: 'Select date',
      helpText: 'Student\'s date of birth',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'student_info',
    },

    studentGender: {
      name: 'student_gender',
      label: 'Gender',
      type: 'select',
      required: false,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' },
      ],
      placeholder: 'Select gender',
      helpText: 'Student\'s gender',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'student_info',
    },

    gradeApplyingFor: {
      name: 'grade_applying_for',
      label: 'Grade Applying For',
      type: 'select',
      required: true,
      validation: { required: true },
      options: [
        { value: 'pre_k', label: 'Pre-K' },
        { value: 'kindergarten', label: 'Kindergarten' },
        { value: 'grade_1', label: 'Grade 1' },
        { value: 'grade_2', label: 'Grade 2' },
        { value: 'grade_3', label: 'Grade 3' },
        { value: 'grade_4', label: 'Grade 4' },
        { value: 'grade_5', label: 'Grade 5' },
        { value: 'grade_6', label: 'Grade 6' },
        { value: 'grade_7', label: 'Grade 7' },
        { value: 'grade_8', label: 'Grade 8' },
        { value: 'grade_9', label: 'Grade 9' },
        { value: 'grade_10', label: 'Grade 10' },
        { value: 'grade_11', label: 'Grade 11' },
        { value: 'grade_12', label: 'Grade 12' },
      ],
      placeholder: 'Select grade',
      helpText: 'Which grade is the student applying for?',
      gridColumn: 'col-span-3',
      showInList: true,
      showInDetail: true,
      sortable: true,
      filterable: true,
      category: 'admission_info',
    },

    enrollmentYear: {
      name: 'enrollment_year',
      label: 'Enrollment Year',
      type: 'select',
      required: true,
      validation: { required: true },
      options: [
        { value: '2024', label: '2024' },
        { value: '2025', label: '2025' },
        { value: '2026', label: '2026' },
        { value: '2027', label: '2027' },
      ],
      placeholder: 'Select year',
      helpText: 'Expected enrollment year',
      gridColumn: 'col-span-3',
      showInList: true,
      showInDetail: true,
      filterable: true,
      category: 'admission_info',
    },

    enrollmentTerm: {
      name: 'enrollment_term',
      label: 'Enrollment Term',
      type: 'select',
      required: false,
      options: [
        { value: 'fall', label: 'Fall' },
        { value: 'spring', label: 'Spring' },
        { value: 'summer', label: 'Summer' },
      ],
      placeholder: 'Select term',
      helpText: 'Which term will the student enroll?',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'admission_info',
    },

    // Parent/Guardian Information
    parentName: {
      name: 'parent_name',
      label: 'Parent/Guardian Name',
      type: 'text',
      required: true,
      validation: { required: true, maxLength: 100 },
      placeholder: 'Enter parent/guardian name',
      helpText: 'Primary parent or guardian\'s full name',
      gridColumn: 'col-span-6',
      showInList: false,
      showInDetail: true,
      searchable: true,
      category: 'parent_info',
    },

    parentRelationship: {
      name: 'parent_relationship',
      label: 'Relationship to Student',
      type: 'select',
      required: false,
      options: [
        { value: 'mother', label: 'Mother' },
        { value: 'father', label: 'Father' },
        { value: 'guardian', label: 'Legal Guardian' },
        { value: 'grandparent', label: 'Grandparent' },
        { value: 'other', label: 'Other' },
      ],
      placeholder: 'Select relationship',
      helpText: 'Relationship to the student',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'parent_info',
    },

    secondaryParentName: {
      name: 'secondary_parent_name',
      label: 'Secondary Parent/Guardian',
      type: 'text',
      required: false,
      validation: { maxLength: 100 },
      placeholder: 'Enter second parent/guardian name',
      helpText: 'Second parent or guardian\'s full name (if applicable)',
      gridColumn: 'col-span-6',
      showInList: false,
      showInDetail: true,
      category: 'parent_info',
    },

    secondaryParentPhone: {
      name: 'secondary_parent_phone',
      label: 'Secondary Phone',
      type: 'tel',
      required: false,
      validation: {
        pattern: '^[\\+]?[0-9\\s\\-()A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$',
        message: 'Please enter a valid phone number',
      },
      placeholder: '+1 (555) 123-4567',
      helpText: 'Second parent/guardian phone number',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'parent_info',
    },

    secondaryParentEmail: {
      name: 'secondary_parent_email',
      label: 'Secondary Email',
      type: 'email',
      required: false,
      validation: {
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        message: 'Please enter a valid email address',
      },
      placeholder: 'parent2@example.com',
      helpText: 'Second parent/guardian email',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'parent_info',
    },

    // Academic Information
    currentSchool: {
      name: 'current_school',
      label: 'Current School',
      type: 'text',
      required: false,
      validation: { maxLength: 200 },
      placeholder: 'Enter current school name',
      helpText: 'Student\'s current school (if any)',
      gridColumn: 'col-span-6',
      showInList: false,
      showInDetail: true,
      category: 'academic_info',
    },

    previousGrade: {
      name: 'previous_grade',
      label: 'Previous Grade',
      type: 'text',
      required: false,
      validation: { maxLength: 50 },
      placeholder: 'e.g., Grade 4',
      helpText: 'Last grade completed',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'academic_info',
    },

    gpa: {
      name: 'gpa',
      label: 'GPA/Academic Performance',
      type: 'text',
      required: false,
      validation: { maxLength: 50 },
      placeholder: 'e.g., 3.8 or A',
      helpText: 'Current GPA or grade average',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'academic_info',
    },

    specialNeeds: {
      name: 'special_needs',
      label: 'Special Needs/Accommodations',
      type: 'textarea',
      required: false,
      validation: { maxLength: 500 },
      rows: 3,
      placeholder: 'Describe any special needs or required accommodations...',
      helpText: 'Any learning disabilities, medical conditions, or required accommodations',
      gridColumn: 'col-span-12',
      showInList: false,
      showInDetail: true,
      category: 'academic_info',
    },

    // Extracurricular & Interests
    interests: {
      name: 'interests',
      label: 'Student Interests',
      type: 'textarea',
      required: false,
      validation: { maxLength: 500 },
      rows: 2,
      placeholder: 'e.g., Soccer, Math Club, Music...',
      helpText: 'Student\'s hobbies, interests, or extracurricular activities',
      gridColumn: 'col-span-12',
      showInList: false,
      showInDetail: true,
      category: 'interests',
    },

    sportsInterest: {
      name: 'sports_interest',
      label: 'Sports Interest',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'basketball', label: 'Basketball' },
        { value: 'soccer', label: 'Soccer' },
        { value: 'baseball', label: 'Baseball' },
        { value: 'volleyball', label: 'Volleyball' },
        { value: 'track', label: 'Track & Field' },
        { value: 'swimming', label: 'Swimming' },
        { value: 'tennis', label: 'Tennis' },
        { value: 'other', label: 'Other' },
      ],
      placeholder: 'Select sports',
      helpText: 'Sports the student is interested in',
      gridColumn: 'col-span-6',
      showInList: false,
      showInDetail: true,
      category: 'interests',
    },

    // Tour & Visit Information
    tourDate: {
      name: 'tour_date',
      label: 'Tour/Visit Date',
      type: 'datetime',
      required: false,
      placeholder: 'Select date and time',
      helpText: 'Scheduled campus tour date',
      gridColumn: 'col-span-6',
      showInList: false,
      showInDetail: true,
      category: 'visit_info',
    },

    tourCompleted: {
      name: 'tour_completed',
      label: 'Tour Completed',
      type: 'checkbox',
      required: false,
      helpText: 'Has the family completed the campus tour?',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'visit_info',
    },

    // Application Information
    applicationReceived: {
      name: 'application_received',
      label: 'Application Received',
      type: 'checkbox',
      required: false,
      helpText: 'Has the application been submitted?',
      gridColumn: 'col-span-3',
      showInList: true,
      showInDetail: true,
      category: 'application',
    },

    applicationFee: {
      name: 'application_fee_paid',
      label: 'Application Fee Paid',
      type: 'checkbox',
      required: false,
      helpText: 'Has the application fee been paid?',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'application',
    },

    documentsSubmitted: {
      name: 'documents_submitted',
      label: 'Documents Submitted',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'birth_certificate', label: 'Birth Certificate' },
        { value: 'transcripts', label: 'School Transcripts' },
        { value: 'immunization', label: 'Immunization Records' },
        { value: 'recommendation', label: 'Teacher Recommendation' },
        { value: 'photo_id', label: 'Photo ID' },
        { value: 'proof_of_residence', label: 'Proof of Residence' },
      ],
      placeholder: 'Select documents',
      helpText: 'Which documents have been submitted?',
      gridColumn: 'col-span-12',
      showInList: false,
      showInDetail: true,
      category: 'application',
    },

    // Financial Information
    financialAidRequested: {
      name: 'financial_aid_requested',
      label: 'Financial Aid Requested',
      type: 'checkbox',
      required: false,
      helpText: 'Is the family requesting financial aid?',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'financial',
    },

    scholarshipInterest: {
      name: 'scholarship_interest',
      label: 'Scholarship Interest',
      type: 'select',
      required: false,
      options: [
        { value: 'academic', label: 'Academic Merit' },
        { value: 'athletic', label: 'Athletic' },
        { value: 'need_based', label: 'Need-Based' },
        { value: 'sibling', label: 'Sibling Discount' },
        { value: 'none', label: 'None' },
      ],
      placeholder: 'Select scholarship type',
      helpText: 'Type of scholarship the family is interested in',
      gridColumn: 'col-span-3',
      showInList: false,
      showInDetail: true,
      category: 'financial',
    },
  },

  // =====================================================
  // FORM LAYOUT - School-specific sections
  // =====================================================
  formLayout: {
    sections: [
      {
        id: 'student_info',
        title: 'Student Information',
        icon: 'user',
        fields: [
          'firstName',
          'lastName',
          'studentAge',
          'studentDateOfBirth',
          'studentGender',
        ],
        collapsible: false,
        defaultExpanded: true,
      },
      {
        id: 'admission_info',
        title: 'Admission Details',
        icon: 'clipboard',
        fields: [
          'gradeApplyingFor',
          'enrollmentYear',
          'enrollmentTerm',
          'status',
          'assignedTo',
          'source',
        ],
        collapsible: false,
        defaultExpanded: true,
      },
      {
        id: 'parent_info',
        title: 'Parent/Guardian Information',
        icon: 'users',
        fields: [
          'parentName',
          'parentRelationship',
          'email',
          'phone',
          'secondaryParentName',
          'secondaryParentEmail',
          'secondaryParentPhone',
        ],
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: 'academic_info',
        title: 'Academic Background',
        icon: 'book',
        fields: [
          'currentSchool',
          'previousGrade',
          'gpa',
          'specialNeeds',
        ],
        collapsible: true,
        defaultExpanded: false,
      },
      {
        id: 'interests',
        title: 'Interests & Activities',
        icon: 'star',
        fields: [
          'interests',
          'sportsInterest',
        ],
        collapsible: true,
        defaultExpanded: false,
      },
      {
        id: 'visit_info',
        title: 'Tour & Visit',
        icon: 'calendar',
        fields: [
          'tourDate',
          'tourCompleted',
        ],
        collapsible: true,
        defaultExpanded: false,
      },
      {
        id: 'application',
        title: 'Application Status',
        icon: 'check',
        fields: [
          'applicationReceived',
          'applicationFee',
          'documentsSubmitted',
        ],
        collapsible: true,
        defaultExpanded: false,
      },
      {
        id: 'financial',
        title: 'Financial Information',
        icon: 'currency',
        fields: [
          'dealValue',
          'financialAidRequested',
          'scholarshipInterest',
          'expectedCloseDate',
        ],
        collapsible: true,
        defaultExpanded: false,
      },
      {
        id: 'additional',
        title: 'Additional Notes',
        icon: 'notes',
        fields: ['notes'],
        collapsible: true,
        defaultExpanded: false,
      },
    ],
  },

  // =====================================================
  // LIST VIEW - School-specific columns
  // =====================================================
  listView: {
    ...baseConfig.listView,
    defaultColumns: [
      'firstName',
      'lastName',
      'gradeApplyingFor',
      'enrollmentYear',
      'status',
      'assignedTo',
      'applicationReceived',
      'email',
      'phone',
    ],
  },

  // =====================================================
  // PIPELINE - School-specific stages
  // =====================================================
  pipeline: {
    enabled: true,
    defaultStages: [
      { name: 'New Inquiry', color: '#3B82F6', order: 1, isClosedWon: false, isClosedLost: false },
      { name: 'Tour Scheduled', color: '#06B6D4', order: 2, isClosedWon: false, isClosedLost: false },
      { name: 'Tour Completed', color: '#8B5CF6', order: 3, isClosedWon: false, isClosedLost: false },
      { name: 'Application Submitted', color: '#F59E0B', order: 4, isClosedWon: false, isClosedLost: false },
      { name: 'Documents Review', color: '#F97316', order: 5, isClosedWon: false, isClosedLost: false },
      { name: 'Interview/Assessment', color: '#10B981', order: 6, isClosedWon: false, isClosedLost: false },
      { name: 'Offer Sent', color: '#84CC16', order: 7, isClosedWon: false, isClosedLost: false },
      { name: 'Enrolled', color: '#22C55E', order: 8, isClosedWon: true, isClosedLost: false },
      { name: 'Waitlisted', color: '#FCD34D', order: 9, isClosedWon: false, isClosedLost: false },
      { name: 'Not Enrolled', color: '#EF4444', order: 10, isClosedWon: false, isClosedLost: true },
    ],
    allowCustomStages: true,
    dragAndDrop: true,
  },

  // =====================================================
  // VALIDATION - School-specific rules
  // =====================================================
  validation: {
    ...baseConfig.validation,
    // School-specific validation
    requireParentInfo: true,
    requireGradeAndYear: true,

    // Status-specific requirements
    statusRequirements: {
      tour_scheduled: ['email', 'phone', 'parentName', 'gradeApplyingFor'],
      application_submitted: ['email', 'phone', 'parentName', 'gradeApplyingFor', 'enrollmentYear', 'studentDateOfBirth'],
      enrolled: ['email', 'phone', 'parentName', 'gradeApplyingFor', 'enrollmentYear', 'dealValue'],
    },
  },

  // =====================================================
  // REPORTS - School-specific reports
  // =====================================================
  reports: {
    available: [
      ...baseConfig.reports.available,
      { id: 'enrollment_by_grade', name: 'Enrollments by Grade', type: 'bar' },
      { id: 'enrollment_by_year', name: 'Enrollments by Year', type: 'line' },
      { id: 'inquiry_source', name: 'Inquiry Sources', type: 'pie' },
      { id: 'tour_conversion', name: 'Tour to Enrollment Conversion', type: 'funnel' },
      { id: 'application_status', name: 'Application Status Overview', type: 'table' },
      { id: 'financial_aid', name: 'Financial Aid Requests', type: 'bar' },
    ],
  },
};

module.exports = schoolConfig;