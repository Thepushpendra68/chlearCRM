const ImportValidationEngine = require('../services/importValidationEngine');

// Mock config for testing
const mockConfig = {
  enums: {
    status: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    lead_source: ['website', 'referral', 'import', 'other'],
    priority: ['low', 'medium', 'high'],
  },
  requiredFields: ['first_name', 'last_name'],
};

describe('ImportValidationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ImportValidationEngine(mockConfig);
  });

  describe('normalizeEnumValue', () => {
    // Test for status
    test('should return exact match for status', () => {
      expect(engine.normalizeEnumValue('qualified', 'status')).toBe('qualified');
    });

    test('should return fuzzy match for status', () => {
      expect(engine.normalizeEnumValue('qualifed', 'status')).toBe('qualified');
    });

    test('should return null for distant match for status', () => {
      expect(engine.normalizeEnumValue('xyz', 'status')).toBeNull();
    });

    test('should return default for null status', () => {
      expect(engine.normalizeEnumValue(null, 'status')).toBe('new');
    });

    // Test for lead_source
    test('should return exact match for lead_source', () => {
      expect(engine.normalizeEnumValue('website', 'lead_source')).toBe('website');
    });

    test('should return fuzzy match for lead_source', () => {
      expect(engine.normalizeEnumValue('referal', 'lead_source')).toBe('referral');
    });

    test('should return null for distant match for lead_source', () => {
      expect(engine.normalizeEnumValue('abc', 'lead_source')).toBeNull();
    });

    test('should return default for null lead_source', () => {
      expect(engine.normalizeEnumValue(null, 'lead_source')).toBe('import');
    });

    // Test for priority
    test('should return exact match for priority', () => {
      expect(engine.normalizeEnumValue('high', 'priority')).toBe('high');
    });

    test('should return fuzzy match for priority', () => {
      expect(engine.normalizeEnumValue('medim', 'priority')).toBe('medium');
    });

    test('should return null for distant match for priority', () => {
      expect(engine.normalizeEnumValue('zzz', 'priority')).toBeNull();
    });

    test('should return default for null priority', () => {
      expect(engine.normalizeEnumValue(null, 'priority')).toBe('medium');
    });

    // NEW TESTS: User's specific data
    test('should match "New Lead" to "new" status', () => {
      expect(engine.normalizeEnumValue('New Lead', 'status')).toBe('new');
    });

    test('should match "Closed Lost" to "lost" status', () => {
      expect(engine.normalizeEnumValue('Closed Lost', 'status')).toBe('lost');
    });

    test('should match "Proposal S" to "proposal" status', () => {
      expect(engine.normalizeEnumValue('Proposal S', 'status')).toBe('proposal');
    });

    test('should match "Instagram" to "social_media" lead_source', () => {
      // Note: This requires enriched config with picklist data
      const engineWithPicklists = new ImportValidationEngine({
        ...mockConfig,
        enums: {
          ...mockConfig.enums,
          lead_source: [...mockConfig.enums.lead_source, 'social_media', 'cold_call', 'event']
        },
        fuzzyMatchData: {
          lead_source: [
            { value: 'website', label: 'Website' },
            { value: 'referral', label: 'Referral' },
            { value: 'social_media', label: 'Instagram' },
            { value: 'social_media', label: 'Facebook' },
            { value: 'event', label: 'Walk-In' },
            { value: 'cold_call', label: 'Cold Call' }
          ]
        }
      });
      expect(engineWithPicklists.normalizeEnumValue('Instagram', 'lead_source')).toBe('social_media');
    });

    test('should match "Walk-In" to "event" lead_source', () => {
      const engineWithPicklists = new ImportValidationEngine({
        ...mockConfig,
        enums: {
          ...mockConfig.enums,
          lead_source: [...mockConfig.enums.lead_source, 'social_media', 'cold_call', 'event']
        },
        fuzzyMatchData: {
          lead_source: [
            { value: 'website', label: 'Website' },
            { value: 'referral', label: 'Referral' },
            { value: 'social_media', label: 'Instagram' },
            { value: 'social_media', label: 'Facebook' },
            { value: 'event', label: 'Walk-In' },
            { value: 'cold_call', label: 'Cold Call' }
          ]
        }
      });
      expect(engineWithPicklists.normalizeEnumValue('Walk-In', 'lead_source')).toBe('event');
    });
  });
});
