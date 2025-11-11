process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

const ApiError = require('../utils/ApiError');
const { supabaseAdmin } = require('../config/supabase');
const contactService = require('../services/contactService');

describe('contactService', () => {
  const mockUser = {
    id: 'user-1',
    company_id: 'company-1',
    role: 'company_admin'
  };

  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const createQueryBuilder = (overrides = {}) => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      catch: jest.fn()
    };

    return Object.assign(builder, overrides);
  };

  describe('getContacts', () => {
    it('returns formatted contacts with pagination metadata', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          company_id: 'company-1',
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@example.com',
          phone: '1234567890',
          user_profiles: { first_name: 'Owner', last_name: 'One' },
          account: { name: 'Acme Corp', industry: 'Tech' }
        },
        {
          id: 'contact-2',
          company_id: 'company-1',
          first_name: 'Bob',
          last_name: 'Smith',
          email: 'bob@example.com',
          phone: '9876543210',
          user_profiles: null,
          account: null
        }
      ];

      const dataQuery = createQueryBuilder({
        range: jest.fn().mockResolvedValue({ data: mockContacts, error: null })
      });

      const countQuery = createQueryBuilder({
        then: jest.fn((resolve) => resolve({ count: 2, error: null }))
      });

      supabaseAdmin.from
        .mockReturnValueOnce(dataQuery)
        .mockReturnValueOnce(countQuery);

      const result = await contactService.getContacts(mockUser, 1, 20, {});

      expect(supabaseAdmin.from).toHaveBeenCalledWith('contacts');
      expect(dataQuery.eq).toHaveBeenCalledWith('company_id', 'company-1');
      expect(result.contacts).toHaveLength(2);
      expect(result.contacts[0].full_name).toBe('Alice Johnson');
      expect(result.contacts[0].account_name).toBe('Acme Corp');
      expect(result.totalItems).toBe(2);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('createContact', () => {
    it('creates a new contact when validation passes', async () => {
      const newContact = {
        first_name: 'Charlie',
        last_name: 'Brown',
        email: 'charlie@example.com',
        phone: '555-0000'
      };

      const createdContact = {
        id: 'contact-new',
        company_id: 'company-1',
        ...newContact,
        assigned_to: mockUser.id
      };

      const duplicateCheckBuilder = createQueryBuilder();
      duplicateCheckBuilder.limit.mockReturnValue(duplicateCheckBuilder);
      duplicateCheckBuilder.single.mockResolvedValue({ data: null, error: null });

      const insertBuilder = createQueryBuilder();
      insertBuilder.insert.mockImplementation(() => insertBuilder);
      insertBuilder.select.mockReturnValue(insertBuilder);
      insertBuilder.single.mockResolvedValue({ data: createdContact, error: null });

      supabaseAdmin.from
        .mockReturnValueOnce(duplicateCheckBuilder)
        .mockReturnValueOnce(insertBuilder);

      const result = await contactService.createContact(newContact, mockUser);

      expect(insertBuilder.insert).toHaveBeenCalled();
      expect(result).toEqual(createdContact);
    });

    it('throws an error when duplicate email is found', async () => {
      const duplicateCheckBuilder = createQueryBuilder();
      duplicateCheckBuilder.limit.mockReturnValue(duplicateCheckBuilder);
      duplicateCheckBuilder.single.mockResolvedValue({ data: { id: 'contact-1' }, error: null });

      supabaseAdmin.from.mockReturnValueOnce(duplicateCheckBuilder);

      await expect(
        contactService.createContact({
          first_name: 'Dana',
          last_name: 'Doe',
          email: 'duplicate@example.com',
          phone: '123'
        }, mockUser)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteContact', () => {
    it('requires elevated role to delete contact', async () => {
      const salesUser = { ...mockUser, role: 'sales_rep' };

      await expect(
        contactService.deleteContact('contact-1', salesUser)
      ).rejects.toThrow('Access denied');
    });

    it('deletes contact when permitted and no lead relationships exist', async () => {
      const contactBuilder = createQueryBuilder();
      contactBuilder.single.mockResolvedValue({
        data: {
          id: 'contact-1',
          company_id: 'company-1',
          user_profiles: null,
          account: null
        },
        error: null
      });

      const leadRelationsBuilder = createQueryBuilder();
      leadRelationsBuilder.then.mockImplementation((resolve) => resolve({ data: [], error: null }));

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.order.mockReturnValue(activitiesBuilder);
      activitiesBuilder.limit.mockResolvedValue({ data: [], error: null });

      const tasksBuilder = createQueryBuilder();
      tasksBuilder.order.mockReturnValue(tasksBuilder);
      tasksBuilder.limit.mockResolvedValue({ data: [], error: null });

      const leadRelationshipCheckBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      const deleteEqMock = jest.fn().mockResolvedValue({ error: null });
      const deleteBuilder = {
        delete: jest.fn().mockReturnValue({ eq: deleteEqMock })
      };

      supabaseAdmin.from
        .mockReturnValueOnce(contactBuilder)
        .mockReturnValueOnce(leadRelationsBuilder)
        .mockReturnValueOnce(activitiesBuilder)
        .mockReturnValueOnce(tasksBuilder)
        .mockReturnValueOnce(leadRelationshipCheckBuilder)
        .mockReturnValueOnce(deleteBuilder);

      await contactService.deleteContact('contact-1', mockUser);

      expect(deleteBuilder.delete).toHaveBeenCalled();
      expect(deleteEqMock).toHaveBeenCalledWith('id', 'contact-1');
    });
  });

  describe('findDuplicates', () => {
    it('aggregates duplicate matches across different criteria', async () => {
      const emailMatches = [{ id: 'contact-email', email: 'dup@example.com' }];
      const phoneMatches = [{ id: 'contact-phone', phone: '12345' }];

      const emailBuilder = createQueryBuilder({
        limit: jest.fn().mockResolvedValue({ data: emailMatches, error: null })
      });

      const phoneBuilder = createQueryBuilder({
        limit: jest.fn().mockResolvedValue({ data: phoneMatches, error: null })
      });

      const nameBuilder = createQueryBuilder({
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      supabaseAdmin.from
        .mockReturnValueOnce(emailBuilder)
        .mockReturnValueOnce(phoneBuilder)
        .mockReturnValueOnce(nameBuilder);

      const result = await contactService.findDuplicates({
        email: 'dup@example.com',
        phone: '12345',
        first_name: 'Test',
        last_name: 'User'
      }, mockUser);

      expect(result.found).toBe(true);
      expect(result.count).toBe(2);
      expect(result.duplicates.map((d) => d.id)).toEqual([
        'contact-email',
        'contact-phone'
      ]);
    });
  });

  describe('linkContactToLead', () => {
    it('links contact to lead when no existing relationship', async () => {
      const contactBuilder = createQueryBuilder();
      contactBuilder.single.mockResolvedValue({
        data: { id: 'contact-1', company_id: 'company-1', user_profiles: null, account: null },
        error: null
      });

      const leadRelationsBuilder = createQueryBuilder();
      leadRelationsBuilder.then.mockImplementation((resolve) => resolve({ data: [], error: null }));

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.order.mockReturnValue(activitiesBuilder);
      activitiesBuilder.limit.mockResolvedValue({ data: [], error: null });

      const tasksBuilder = createQueryBuilder();
      tasksBuilder.order.mockReturnValue(tasksBuilder);
      tasksBuilder.limit.mockResolvedValue({ data: [], error: null });

      const leadBuilder = createQueryBuilder();
      leadBuilder.single.mockResolvedValue({
        data: { id: 'lead-1', company_id: 'company-1' },
        error: null
      });

      const existingRelationshipBuilder = createQueryBuilder();
      existingRelationshipBuilder.single.mockResolvedValue({ data: null, error: null });

      const insertBuilder = createQueryBuilder();
      insertBuilder.insert.mockImplementation(() => insertBuilder);
      insertBuilder.select.mockReturnValue(insertBuilder);
      insertBuilder.single.mockResolvedValue({ data: { id: 'relationship-1' }, error: null });

      let leadContactsCall = 0;
      supabaseAdmin.from.mockImplementation((table) => {
        switch (table) {
          case 'contacts':
            return contactBuilder;
          case 'lead_contacts':
            leadContactsCall += 1;
            if (leadContactsCall === 1) {
              return leadRelationsBuilder;
            }
            if (leadContactsCall === 2) {
              return existingRelationshipBuilder;
            }
            return insertBuilder;
          case 'activities':
            return activitiesBuilder;
          case 'tasks':
            return tasksBuilder;
          case 'leads':
            return leadBuilder;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const result = await contactService.linkContactToLead(
        'contact-1',
        'lead-1',
        mockUser,
        { is_primary: true }
      );

      expect(insertBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        contact_id: 'contact-1',
        lead_id: 'lead-1',
        company_id: 'company-1'
      }));
      expect(result).toEqual({ id: 'relationship-1' });

      supabaseAdmin.from.mockReset();
    });
  });
});
