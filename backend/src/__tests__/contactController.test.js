process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

jest.mock('../services/contactService');
jest.mock('../utils/auditLogger', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(true),
  AuditActions: {
    CONTACT_CREATED: 'contact_created',
    CONTACT_UPDATED: 'contact_updated',
    CONTACT_DELETED: 'contact_deleted',
    CONTACT_STATUS_CHANGED: 'contact_status_changed',
    CONTACT_OWNER_CHANGED: 'contact_owner_changed'
  },
  AuditSeverity: {
    INFO: 'info',
    WARNING: 'warning'
  }
}));

const { validationResult } = require('express-validator');
const contactService = require('../services/contactService');
const contactController = require('../controllers/contactController');
const ApiError = require('../utils/ApiError');

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('contactController', () => {
  let req, res, next;

  const mockUser = {
    id: 'user-123',
    company_id: 'company-1',
    role: 'company_admin'
  };

  beforeEach(() => {
    req = {
      user: mockUser,
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getContacts', () => {
    it('returns paginated contacts', async () => {
      const mockResponse = {
        contacts: [{ id: 'contact-1' }],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        hasNext: false,
        hasPrev: false
      };

      contactService.getContacts.mockResolvedValue(mockResponse);
      req.query = { page: '1', limit: '20' };

      await contactController.getContacts(req, res, next);

      expect(contactService.getContacts).toHaveBeenCalledWith(mockUser, 1, 20, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResponse.contacts,
        pagination: expect.objectContaining({ total_items: 1 })
      });
    });

    it('passes errors to next handler', async () => {
      const error = new Error('Database error');
      contactService.getContacts.mockRejectedValue(error);

      await contactController.getContacts(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getContactById', () => {
    it('returns contact data', async () => {
      const contact = { id: 'contact-1', first_name: 'Test' };
      contactService.getContactById.mockResolvedValue(contact);
      req.params.id = 'contact-1';

      await contactController.getContactById(req, res, next);

      expect(contactService.getContactById).toHaveBeenCalledWith('contact-1', mockUser);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: contact });
    });

    it('forwards service errors', async () => {
      const error = new ApiError('Not found', 404);
      contactService.getContactById.mockRejectedValue(error);
      req.params.id = 'missing';

      await contactController.getContactById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createContact', () => {
    it('creates contact when validation succeeds', async () => {
      const payload = { first_name: 'New', last_name: 'Contact' };
      const created = { id: 'contact-new', ...payload };

      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      contactService.createContact.mockResolvedValue(created);
      req.body = payload;

      await contactController.createContact(req, res, next);

      expect(contactService.createContact).toHaveBeenCalledWith(expect.objectContaining(payload), mockUser);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: created,
        message: 'Contact created successfully'
      });
    });

    it('returns validation errors when invalid payload', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'first_name', msg: 'Required' }]
      });

      await contactController.createContact(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(contactService.createContact).not.toHaveBeenCalled();
    });
  });

  describe('updateContact', () => {
    it('updates contact with valid payload', async () => {
      const updated = { id: 'contact-1', first_name: 'Updated' };
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      contactService.updateContact.mockResolvedValue({
        updatedContact: updated,
        previousContact: { id: 'contact-1', first_name: 'Old' }
      });
      req.params.id = 'contact-1';
      req.body = { first_name: 'Updated' };

      await contactController.updateContact(req, res, next);

      expect(contactService.updateContact).toHaveBeenCalledWith('contact-1', { first_name: 'Updated' }, mockUser);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('handles service errors', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      const error = new ApiError('Contact not found', 404);
      contactService.updateContact.mockRejectedValue(error);
      req.params.id = 'missing';

      await contactController.updateContact(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteContact', () => {
    it('deletes contact and returns success message', async () => {
      contactService.deleteContact.mockResolvedValue({ deletedContact: { id: 'contact-1' } });
      req.params.id = 'contact-1';

      await contactController.deleteContact(req, res, next);

      expect(contactService.deleteContact).toHaveBeenCalledWith('contact-1', mockUser);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('linkToLead', () => {
    it('links contact to lead and returns relationship data', async () => {
      contactService.linkContactToLead.mockResolvedValue({ id: 'rel-1' });
      req.params = { id: 'contact-1', leadId: 'lead-1' };
      req.body = { is_primary: true };

      await contactController.linkToLead(req, res, next);

      expect(contactService.linkContactToLead).toHaveBeenCalledWith('contact-1', 'lead-1', mockUser, { is_primary: true });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('unlinkFromLead', () => {
    it('unlinks contact from lead and returns success', async () => {
      contactService.unlinkContactFromLead.mockResolvedValue({ success: true });
      req.params = { id: 'contact-1', leadId: 'lead-1' };

      await contactController.unlinkFromLead(req, res, next);

      expect(contactService.unlinkContactFromLead).toHaveBeenCalledWith('contact-1', 'lead-1', mockUser);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('findDuplicates', () => {
    it('returns duplicate search results', async () => {
      const duplicates = { found: true, duplicates: [{ id: 'dup-1' }], count: 1 };
      contactService.findDuplicates.mockResolvedValue(duplicates);
      req.body = { email: 'dup@example.com' };

      await contactController.findDuplicates(req, res, next);

      expect(contactService.findDuplicates).toHaveBeenCalledWith({ email: 'dup@example.com', phone: undefined, first_name: undefined, last_name: undefined }, mockUser);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: duplicates });
    });

    it('returns validation error when no criteria provided', async () => {
      req.body = {};

      await contactController.findDuplicates(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(contactService.findDuplicates).not.toHaveBeenCalled();
    });
  });

  describe('getContactStats', () => {
    it('returns aggregated statistics', async () => {
      const stats = { total: 5 };
      contactService.getContactStats.mockResolvedValue(stats);

      await contactController.getContactStats(req, res, next);

      expect(contactService.getContactStats).toHaveBeenCalledWith(mockUser);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });
});
