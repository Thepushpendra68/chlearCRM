/**
 * Configuration Loader Test Suite
 * Tests for the industry configuration system
 */

const {
  loadIndustryConfig,
  getConfigForCompany,
  getAllFields,
  getFieldDefinition,
  getFormLayout,
  validateCustomFields,
  getAvailableIndustries
} = require('../config/industry/configLoader');

const baseConfig = require('../config/industry/base.config');
const schoolConfig = require('../config/industry/school.config');

describe('Configuration Loader', () => {
  describe('loadIndustryConfig', () => {
    test('should load base configuration', () => {
      const config = loadIndustryConfig('generic');
      
      expect(config).toBeDefined();
      expect(config.industryType).toBe('generic');
      expect(config.industryName).toBe('Generic CRM');
      expect(config.terminology).toBeDefined();
      expect(config.coreFields).toBeDefined();
    });

    test('should load school configuration', () => {
      const config = loadIndustryConfig('school');
      
      expect(config).toBeDefined();
      expect(config.industryType).toBe('school');
      expect(config.industryName).toBe('School/Education CRM');
      expect(config.customFields).toBeDefined();
    });

    test('should fallback to generic for unknown industry', () => {
      const config = loadIndustryConfig('nonexistent_industry');
      
      expect(config).toBeDefined();
      expect(config.industryType).toBe('generic');
    });

    test('should cache configuration after first load', () => {
      // Load configuration twice
      const config1 = loadIndustryConfig('generic');
      const config2 = loadIndustryConfig('generic');
      
      // Should return the same object (from cache)
      expect(config1).toBe(config2);
    });
  });

  describe('getConfigForCompany', () => {
    test('should load config based on company industry_type', () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test School',
        industry_type: 'school'
      };
      
      const config = getConfigForCompany(mockCompany);
      
      expect(config).toBeDefined();
      expect(config.industryType).toBe('school');
    });

    test('should fallback to generic if company has no industry_type', () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        industry_type: null
      };
      
      const config = getConfigForCompany(mockCompany);
      
      expect(config.industryType).toBe('generic');
    });
  });

  describe('getAllFields', () => {
    test('should return all core fields for base config', () => {
      const config = loadIndustryConfig('generic');
      const fields = getAllFields(config);
      
      expect(typeof fields).toBe('object');
      expect(Object.keys(fields).length).toBeGreaterThan(0);
      
      // Check that core fields exist
      const firstNameField = fields.firstName;
      expect(firstNameField).toBeDefined();
      expect(firstNameField.name).toBe('first_name');
      expect(firstNameField.isCustom).toBe(false);
    });

    test('should return core + custom fields for school config', () => {
      const config = loadIndustryConfig('school');
      const fields = getAllFields(config);
      
      // Should have more fields than base config
      const baseFields = getAllFields(baseConfig);
      expect(Object.keys(fields).length).toBeGreaterThan(Object.keys(baseFields).length);
      
      // Check custom fields exist
      const customFieldsCount = Object.values(fields).filter(f => f.isCustom).length;
      expect(customFieldsCount).toBeGreaterThan(0);
    });
  });

  describe('getFieldDefinition', () => {
    test('should return field definition by key', () => {
      const config = loadIndustryConfig('generic');
      const field = getFieldDefinition(config, 'firstName');
      
      expect(field).toBeDefined();
      expect(field.name).toBe('first_name');
      expect(field.label).toBe('First Name');
      expect(field.type).toBe('text');
      expect(field.isCustom).toBe(false);
    });

    test('should return null for non-existent field', () => {
      const config = loadIndustryConfig('generic');
      const field = getFieldDefinition(config, 'nonExistentField');
      
      expect(field).toBeNull();
    });

    test('should find custom fields in school config', () => {
      const config = loadIndustryConfig('school');
      const field = getFieldDefinition(config, 'studentAge');
      
      expect(field).toBeDefined();
      expect(field.isCustom).toBe(true);
      expect(field.name).toBe('student_age');
    });
  });

  describe('getFormLayout', () => {
    test('should return form sections', () => {
      const config = loadIndustryConfig('generic');
      const layout = getFormLayout(config);
      
      expect(layout).toBeDefined();
      expect(Array.isArray(layout)).toBe(true);
      expect(layout.length).toBeGreaterThan(0);
    });

    test('should have valid section structure', () => {
      const config = loadIndustryConfig('school');
      const layout = getFormLayout(config);
      
      const firstSection = layout[0];
      expect(firstSection).toBeDefined();
      expect(firstSection.id).toBeDefined();
      expect(firstSection.title).toBeDefined();
      expect(Array.isArray(firstSection.fields)).toBe(true);
    });
  });

  describe('validateCustomFields', () => {
    test('should validate valid custom fields data', () => {
      const config = loadIndustryConfig('school');
      const customFieldsData = {
        student_age: 10,
        grade_applying_for: 'grade_5',
        enrollment_year: '2025'
      };
      
      const validation = validateCustomFields(config, customFieldsData);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    test('should catch validation errors for exceeding max', () => {
      const config = loadIndustryConfig('school');
      const invalidData = {
        student_age: 150,  // Exceeds max age (25)
      };
      
      const validation = validateCustomFields(config, invalidData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.field === 'student_age')).toBe(true);
    });

    test('should catch invalid select options', () => {
      const config = loadIndustryConfig('school');
      const invalidData = {
        grade_applying_for: 'invalid_grade',  // Invalid option
      };
      
      const validation = validateCustomFields(config, invalidData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.field === 'grade_applying_for')).toBe(true);
    });

    test('should validate number ranges', () => {
      const config = loadIndustryConfig('school');
      const invalidAgeData = {
        student_age: -5,  // Below minimum (2)
      };
      
      const validation = validateCustomFields(config, invalidAgeData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.field === 'student_age')).toBe(true);
    });

    test('should pass validation for empty custom fields', () => {
      const config = loadIndustryConfig('school');
      const emptyData = {};
      
      const validation = validateCustomFields(config, emptyData);
      
      // Empty data is valid - validation only checks provided fields
      // Required field validation happens at form submission level
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('getAvailableIndustries', () => {
    test('should return list of available industry types', () => {
      const industries = getAvailableIndustries();
      
      expect(Array.isArray(industries)).toBe(true);
      expect(industries.length).toBeGreaterThan(0);
      const types = industries.map(industry => industry.type);
      expect(types).toContain('generic');
      expect(types).toContain('school');
    });

    test('should return industry metadata', () => {
      const industries = getAvailableIndustries();
      
      expect(industries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'generic',
            name: 'Generic CRM'
          }),
          expect.objectContaining({
            type: 'school',
            name: 'School/Education CRM'
          })
        ])
      );
    });
  });

  describe('Terminology System', () => {
    test('should have different terminology for different industries', () => {
      const genericConfig = loadIndustryConfig('generic');
      const schoolConfig = loadIndustryConfig('school');
      
      expect(genericConfig.terminology.lead).not.toBe(schoolConfig.terminology.lead);
      expect(genericConfig.terminology.lead).toBe('Lead');
      expect(schoolConfig.terminology.lead).toBe('Prospective Student');
    });

    test('should maintain plural forms', () => {
      const schoolConfig = loadIndustryConfig('school');
      
      expect(schoolConfig.terminology.lead).toBe('Prospective Student');
      expect(schoolConfig.terminology.leads).toBe('Prospective Students');
    });
  });

  describe('Configuration Inheritance', () => {
    test('school config should extend base config', () => {
      const schoolConfig = loadIndustryConfig('school');
      
      // Should have core fields from base
      const fields = getAllFields(schoolConfig);
      expect(fields.firstName).toBeDefined();
      
      // Should also have custom fields
      const hasCustomField = Object.values(fields).some(f => f.isCustom === true);
      expect(hasCustomField).toBe(true);
    });

    test('custom terminology should override base', () => {
      const schoolConfig = loadIndustryConfig('school');
      
      // Overridden terms
      expect(schoolConfig.terminology.lead).toBe('Prospective Student');
      
      // Inherited/overridden terms
      expect(schoolConfig.terminology.contact).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null or undefined company', () => {
      const config = getConfigForCompany(null);
      expect(config.industryType).toBe('generic');
    });

    test('should treat empty custom fields data as valid', () => {
      const config = loadIndustryConfig('school');
      const validation = validateCustomFields(config, {});
      
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should handle null field values', () => {
      const config = loadIndustryConfig('school');
      const field = getFieldDefinition(config, null);
      
      expect(field).toBeNull();
    });
  });
});
