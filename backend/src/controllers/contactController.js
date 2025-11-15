const { validationResult } = require('express-validator');
const contactService = require('../services/contactService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Contact Controller
 * Handles all contact-related operations
 * Extends BaseController for standardized patterns
 */
class ContactController extends BaseController {
  /**
   * Build contact display name for logging
   */
  buildContactDisplayName(contact = {}) {
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return name || contact.email || contact.phone || `Contact ${contact.id}`;
  }

  /**
   * Compute changes between contact states
   */
  computeContactChanges(before = {}, after = {}) {
    const trackedFields = [
      ['first_name', 'first_name'],
      ['last_name', 'last_name'],
      ['email', 'email'],
      ['phone', 'phone'],
      ['mobile_phone', 'mobile_phone'],
      ['title', 'title'],
      ['department', 'department'],
      ['status', 'status'],
      ['lifecycle_stage', 'lifecycle_stage'],
      ['is_decision_maker', 'is_decision_maker'],
      ['assigned_to', 'assigned_to'],
      ['account_id', 'account_id']
    ];

    return trackedFields.reduce((changes, [field, alias]) => {
      const beforeValue = before[field] ?? null;
      const afterValue = after[field] ?? null;

      if (beforeValue !== afterValue) {
        changes.push({
          field: alias,
          before: beforeValue,
          after: afterValue
        });
      }

      return changes;
    }, []);
  }

  /**
   * @desc    Get all contacts with pagination, search, and filtering
   * @route   GET /api/contacts
   * @access  Private
   */
  getContacts = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      assigned_to = '',
      account_id = '',
      lifecycle_stage = '',
      is_decision_maker = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search,
      status,
      assigned_to,
      account_id,
      lifecycle_stage,
      is_decision_maker: is_decision_maker === 'true' ? true : is_decision_maker === 'false' ? false : undefined,
      sort_by,
      sort_order
    };

    const result = await contactService.getContacts(
      req.user,
      parseInt(page),
      parseInt(limit),
      filters
    );

    const pagination = {
      current_page: parseInt(page),
      total_pages: result.totalPages,
      total_items: result.totalItems,
      items_per_page: parseInt(limit),
      has_next: result.hasNext,
      has_prev: result.hasPrev
    };

    this.paginated(res, result.contacts, pagination, 200, 'Contacts retrieved successfully');
  });

  /**
   * @desc    Get contact by ID
   * @route   GET /api/contacts/:id
   * @access  Private
   */
  getContactById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await contactService.getContactById(id, req.user);

    if (!contact) {
      return this.notFound(res, 'Contact not found');
    }

    this.success(res, contact, 200, 'Contact retrieved successfully');
  });

  /**
   * @desc    Create new contact
   * @route   POST /api/contacts
   * @access  Private
   */
  createContact = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      return this.validationError(res, 'Validation failed', errorMessages);
    }

    const contactData = req.body;
    const contact = await contactService.createContact(contactData, req.user);

    await logAuditEvent(req, {
      action: AuditActions.CONTACT_CREATED,
      resourceType: 'contact',
      resourceId: contact.id,
      resourceName: this.buildContactDisplayName(contact),
      companyId: contact.company_id,
      details: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        account_id: contact.account_id,
        assigned_to: contact.assigned_to
      }
    });

    this.created(res, contact, 'Contact created successfully');
  });

  /**
   * @desc    Update contact
   * @route   PUT /api/contacts/:id
   * @access  Private
   */
  updateContact = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      return this.validationError(res, 'Validation failed', errorMessages);
    }

    const { id } = req.params;
    const contactData = req.body;

    const result = await contactService.updateContact(id, contactData, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    const changes = this.computeContactChanges(result.previousContact, result.data);
    if (changes.length > 0) {
      await logAuditEvent(req, {
        action: AuditActions.CONTACT_UPDATED,
        resourceType: 'contact',
        resourceId: result.data?.id,
        resourceName: this.buildContactDisplayName(result.data),
        companyId: result.data?.company_id,
        details: { changes }
      });
    }

    this.updated(res, result.data, 'Contact updated successfully');
  });

  /**
   * @desc    Delete contact
   * @route   DELETE /api/contacts/:id
   * @access  Private
   */
  deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await contactService.deleteContact(id, req.user);

    if (!result.success) {
      return this.notFound(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.CONTACT_DELETED,
      resourceType: 'contact',
      resourceId: id,
      resourceName: this.buildContactDisplayName(result.deletedContact || { id }),
      companyId: result.deletedContact?.company_id ?? req.user.company_id,
      severity: AuditSeverity.WARNING,
      details: {
        contact_name: result.deletedContact?.first_name + ' ' + result.deletedContact?.last_name,
        email: result.deletedContact?.email
      }
    });

    this.deleted(res, result.message);
  });

  /**
   * @desc    Link contact to lead
   * @route   POST /api/contacts/:id/link-to-lead
   * @access  Private
   */
  linkToLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lead_id } = req.body;

    const result = await contactService.linkToLead(id, lead_id, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.CONTACT_LINKED_TO_LEAD,
      resourceType: 'contact',
      resourceId: id,
      resourceName: this.buildContactDisplayName(result.contact),
      companyId: result.contact?.company_id ?? req.user.company_id,
      details: {
        lead_id: lead_id,
        contact_role: req.body.role || null
      }
    });

    this.success(res, result.data, 200, 'Contact linked to lead successfully');
  });

  /**
   * @desc    Unlink contact from lead
   * @route   DELETE /api/contacts/:id/link-to-lead
   * @access  Private
   */
  unlinkFromLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lead_id } = req.body;

    const result = await contactService.unlinkFromLead(id, lead_id, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.CONTACT_UNLINKED_FROM_LEAD,
      resourceType: 'contact',
      resourceId: id,
      resourceName: this.buildContactDisplayName(result.contact),
      companyId: result.contact?.company_id ?? req.user.company_id,
      details: {
        lead_id: lead_id
      }
    });

    this.success(res, result.data, 200, 'Contact unlinked from lead successfully');
  });

  /**
   * @desc    Find duplicate contacts
   * @route   GET /api/contacts/duplicates
   * @access  Private
   */
  findDuplicates = asyncHandler(async (req, res) => {
    const { email, phone } = req.query;

    const result = await contactService.findDuplicates(req.user, { email, phone });

    this.success(res, result, 200, 'Duplicate contacts retrieved successfully');
  });

  /**
   * @desc    Get contact statistics
   * @route   GET /api/contacts/stats
   * @access  Private
   */
  getContactStats = asyncHandler(async (req, res) => {
    const result = await contactService.getContactStats(req.user);

    this.success(res, result, 200, 'Contact statistics retrieved successfully');
  });
}

module.exports = new ContactController();
