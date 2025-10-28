process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

const mockImportConfig = {
  requiredFields: ['first_name', 'last_name'],
  enums: {
    status: ['new', 'contacted', 'qualified'],
    lead_source: ['website', 'referral', 'import'],
    priority: ['low', 'medium', 'high']
  },
  numericRanges: {
    deal_value: { min: 0 },
    probability: { min: 0, max: 100 }
  },
  fuzzyMatchData: null
};

jest.mock('../services/importConfigService', () => ({
  getCompanyConfig: jest.fn().mockResolvedValue(mockImportConfig),
  invalidateCache: jest.fn()
}));

jest.mock('../services/importTelemetryService', () => ({
  recordDryRun: jest.fn(),
  recordImport: jest.fn()
}));

const importService = require('../services/importService');
const { supabaseAdmin } = require('../config/supabase');

const createLeadLookupBuilder = (result) => {
  const execute = () => Promise.resolve(result);
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => execute()),
    maybeSingle: jest.fn(() => execute()),
    single: jest.fn(() => execute()),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    then: jest.fn((resolve) => execute().then(resolve))
  };

  return { builder, eqMock: builder.eq };
};

const createDefaultBuilder = () => createLeadLookupBuilder({ data: [], error: null }).builder;

describe('importService.validateLeads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flags duplicate emails within the same company', async () => {
    const { builder, eqMock } = createLeadLookupBuilder({
      data: [
        {
          id: 'existing-lead',
          email: 'dupe@example.com',
          phone: '+123456789'
        }
      ],
      error: null
    });

    supabaseAdmin.from.mockImplementation((table) => {
      if (table === 'leads') {
        return builder;
      }
      return createDefaultBuilder();
    });

    const result = await importService.validateLeads(
      [
        {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'dupe@example.com',
          phone: '+123456789'
        }
      ],
      'company-1'
    );

    expect(eqMock).toHaveBeenCalledWith('company_id', 'company-1');
    expect(eqMock).toHaveBeenCalledWith('email', 'dupe@example.com');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errors).toContain('Email already exists');
    expect(result.validatedLeads).toHaveLength(0);
  });

  it('accepts unique emails and normalizes casing', async () => {
    const { builder } = createLeadLookupBuilder({
      data: [],
      error: null
    });

    supabaseAdmin.from.mockImplementation((table) => {
      if (table === 'leads') {
        return builder;
      }
      return createDefaultBuilder();
    });

    const result = await importService.validateLeads(
      [
        {
          first_name: 'John',
          last_name: 'Smith',
          email: 'John.Smith@Example.COM',
          phone: '+109876543'
        }
      ],
      'company-2'
    );

    expect(result.errors).toHaveLength(0);
    expect(result.validatedLeads).toHaveLength(1);
    expect(result.validatedLeads[0].email).toBe('john.smith@example.com');
  });
});
