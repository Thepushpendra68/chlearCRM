const {
  loadIndustryConfig,
  getConfigForCompany,
  getFieldDefinition,
  getAllFields,
  getFieldsForSection,
  getFormLayout,
  getValidationSchema,
  validateData,
  getAvailableIndustries,
  clearCache,
} = require('../config/industry/configLoader');

describe('Config Loader', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('loadIndustryConfig', () => {
    it('should load the generic config by default', () => {
      const config = loadIndustryConfig();
      expect(config.industryType).toBe('generic');
    });

    it('should load the school config', () => {
      const config = loadIndustryConfig('school');
      expect(config.industryType).toBe('school');
    });

    it('should fall back to the generic config if the industry config does not exist', () => {
      const config = loadIndustryConfig('nonexistent');
      expect(config.industryType).toBe('generic');
    });

    it('should cache the config', () => {
      const config1 = loadIndustryConfig('school');
      const config2 = loadIndustryConfig('school');
      expect(config1).toBe(config2);
    });
  });

  describe('getConfigForCompany', () => {
    it('should load the config for the company\'s industry type', () => {
      const company = { industry_type: 'school' };
      const config = getConfigForCompany(company);
      expect(config.industryType).toBe('school');
    });

    it('should load the generic config if the company has no industry type', () => {
      const company = {};
      const config = getConfigForCompany(company);
      expect(config.industryType).toBe('generic');
    });
  });

  describe('getValidationSchema', () => {
    it('should return the validation schema for the config', () => {
      const config = loadIndustryConfig('school');
      const schema = getValidationSchema(config);
      expect(schema.firstName.required).toBe(true);
      expect(schema.email.pattern.toString()).toBe('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/');
    });
  });

  describe('validateData', () => {
    it('should validate the data against the schema', () => {
      const config = loadIndustryConfig('school');
      const data = { firstName: 'J', email: 'invalid-email', lastName: 'D', gradeApplyingFor: 'grade_1', enrollmentYear: '2025', parentName: 'P' };
      const result = validateData(config, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors[0].field).toBe('firstName');
      expect(result.errors[1].field).toBe('lastName');
      expect(result.errors[2].field).toBe('email');
      expect(result.errors[3].field).toBe('status');
    });

    it('should return valid if the data is valid', () => {
      const config = loadIndustryConfig('school');
      const data = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', status: 'new_inquiry', gradeApplyingFor: 'grade_9', enrollmentYear: '2025', parentName: 'Jane Doe' };
      const result = validateData(config, data);
      expect(result.valid).toBe(true);
    });
  });
});