const { validationResult } = require('express-validator');
const contactService = require('../services/contactService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

const buildContactDisplayName = (contact = {}) => {
  const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
  return name || contact.email || contact.phone || `Contact ${contact.id}`;
};

const computeContactChanges = (before = {}, after = {}) => {
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
};

/**
 * @desc    Get all contacts with pagination, search, and filtering
 * @route   GET /api/contacts
 * @access  Private
 */
const getContacts = async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      data: result.contacts,
      pagination: {
        current_page: parseInt(page),
        total_pages: result.totalPages,
        total_items: result.totalItems,
        items_per_page: parseInt(limit),
        has_next: result.hasNext,
        has_prev: result.hasPrev
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contact by ID
 * @route   GET /api/contacts/:id
 * @access  Private
 */
const getContactById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await contactService.getContactById(id, req.user);

    if (!contact) {
      throw new ApiError('Contact not found', 404);
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new contact
 * @route   POST /api/contacts
 * @access  Private
 */
const createContact = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        error: {
          message: `Please check the following fields: ${fieldErrors}`,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const contactData = {
      ...req.body,
      created_by: req.user.id,
      company_id: req.user.company_id
    };

    const contact = await contactService.createContact(contactData, req.user);

    await logAuditEvent(req, {
      action: AuditActions.CONTACT_CREATED,
      resourceType: 'contact',
      resourceId: contact.id,
      resourceName: buildContactDisplayName(contact),
      companyId: contact.company_id,
      details: {
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        account_id: contact.account_id,
        assigned_to: contact.assigned_to
      },
      metadata: {
        created_by: contact.created_by
      }
    });

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update contact
 * @route   PUT /api/contacts/:id
 * @access  Private
 */
const updateContact = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        error: {
          message: `Please check the following fields: ${fieldErrors}`,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { id } = req.params;
    const contactData = req.body;

    const contactResult = await contactService.updateContact(id, contactData, req.user);

    if (!contactResult) {
      throw new ApiError('Contact not found', 404);
    }

    const { updatedContact, previousContact } = contactResult;
    const changes = computeContactChanges(previousContact, updatedContact);

    if (changes.length > 0) {
      await logAuditEvent(req, {
        action: AuditActions.CONTACT_UPDATED,
        resourceType: 'contact',
        resourceId: updatedContact.id,
        resourceName: buildContactDisplayName(updatedContact),
        companyId: updatedContact.company_id,
        details: {
          changes
        }
      });

      const statusChange = changes.find(change => change.field === 'status');
      if (statusChange) {
        await logAuditEvent(req, {
          action: AuditActions.CONTACT_STATUS_CHANGED,
          resourceType: 'contact',
          resourceId: updatedContact.id,
          resourceName: buildContactDisplayName(updatedContact),
          companyId: updatedContact.company_id,
          severity: AuditSeverity.INFO,
          details: {
            from: statusChange.before,
            to: statusChange.after
          }
        });
      }

      const ownerChange = changes.find(change => change.field === 'assigned_to');
      if (ownerChange) {
        await logAuditEvent(req, {
          action: AuditActions.CONTACT_OWNER_CHANGED,
          resourceType: 'contact',
          resourceId: updatedContact.id,
          resourceName: buildContactDisplayName(updatedContact),
          companyId: updatedContact.company_id,
          severity: AuditSeverity.INFO,
          details: {
            from: ownerChange.before,
            to: ownerChange.after
          }
        });
      }
    }

    res.json({
      success: true,
      data: updatedContact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete contact
 * @route   DELETE /api/contacts/:id
 * @access  Private
 */
const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await contactService.deleteContact(id, req.user);

    if (!result) {
      throw new ApiError('Contact not found', 404);
    }

    if (result.deletedContact) {
      await logAuditEvent(req, {
        action: AuditActions.CONTACT_DELETED,
        resourceType: 'contact',
        resourceId: result.deletedContact.id,
        resourceName: buildContactDisplayName(result.deletedContact),
        companyId: result.deletedContact.company_id,
        severity: AuditSeverity.WARNING,
        details: {
          email: result.deletedContact.email,
          account_id: result.deletedContact.account_id
        }
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Link contact to lead
 * @route   POST /api/contacts/:id/leads/:leadId
 * @access  Private
 */
const linkToLead = async (req, res, next) => {
  try {
    const { id: contactId, leadId } = req.params;
    const { is_primary, role } = req.body;

    const relationship = await contactService.linkContactToLead(
      contactId,
      leadId,
      req.user,
      { is_primary, role }
    );

    await logAuditEvent(req, {
      action: 'CONTACT_LINKED_TO_LEAD',
      resourceType: 'contact',
      resourceId: contactId,
      companyId: req.user.company_id,
      details: {
        lead_id: leadId,
        is_primary,
        role
      }
    });

    res.json({
      success: true,
      data: relationship,
      message: 'Contact linked to lead successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlink contact from lead
 * @route   DELETE /api/contacts/:id/leads/:leadId
 * @access  Private
 */
const unlinkFromLead = async (req, res, next) => {
  try {
    const { id: contactId, leadId } = req.params;

    await contactService.unlinkContactFromLead(contactId, leadId, req.user);

    await logAuditEvent(req, {
      action: 'CONTACT_UNLINKED_FROM_LEAD',
      resourceType: 'contact',
      resourceId: contactId,
      companyId: req.user.company_id,
      details: {
        lead_id: leadId
      }
    });

    res.json({
      success: true,
      message: 'Contact unlinked from lead successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Find duplicate contacts
 * @route   POST /api/contacts/duplicates
 * @access  Private
 */
const findDuplicates = async (req, res, next) => {
  try {
    const { email, phone, first_name, last_name } = req.body;

    if (!email && !phone && !(first_name && last_name)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide email, phone, or both first and last name to search for duplicates'
        }
      });
    }

    const result = await contactService.findDuplicates(
      { email, phone, first_name, last_name },
      req.user
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contact statistics
 * @route   GET /api/contacts/stats
 * @access  Private
 */
const getContactStats = async (req, res, next) => {
  try {
    const stats = await contactService.getContactStats(req.user);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  linkToLead,
  unlinkFromLead,
  findDuplicates,
  getContactStats
};

