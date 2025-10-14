process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

const importService = require('../services/importService');
const { supabaseAdmin } = require('../config/supabase');

const createLeadLookupBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.maybeSingle = jest.fn().mockResolvedValue(result);
  return { builder, eqMock: builder.eq };
};

describe('importService.validateLeads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flags duplicate emails within the same company', async () => {
    const { builder, eqMock } = createLeadLookupBuilder({
      data: { id: 'existing-lead' },
      error: null
    });

    supabaseAdmin.from.mockReturnValueOnce(builder);

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

    expect(eqMock.mock.calls).toEqual([
      ['company_id', 'company-1'],
      ['email', 'dupe@example.com']
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errors).toContain('Email already exists');
    expect(result.validatedLeads).toHaveLength(0);
  });

  it('accepts unique emails and normalizes casing', async () => {
    const { builder } = createLeadLookupBuilder({
      data: null,
      error: null
    });

    supabaseAdmin.from.mockReturnValueOnce(builder);

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
