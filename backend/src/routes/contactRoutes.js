const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  createContactValidation,
  updateContactValidation,
  contactIdValidation,
  linkToLeadValidation,
  findDuplicatesValidation
} = require('../validators/contactValidators');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/contacts/stats
 * @desc    Get contact statistics
 * @access  Private
 */
router.get('/stats', contactController.getContactStats);

/**
 * @route   POST /api/contacts/duplicates
 * @desc    Find duplicate contacts
 * @access  Private
 */
router.post('/duplicates', findDuplicatesValidation, contactController.findDuplicates);

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts with pagination and filters
 * @access  Private
 */
router.get('/', contactController.getContacts);

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Private
 */
router.get('/:id', contactIdValidation, contactController.getContactById);

/**
 * @route   POST /api/contacts
 * @desc    Create new contact
 * @access  Private
 */
router.post('/', createContactValidation, contactController.createContact);

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put('/:id', updateContactValidation, contactController.updateContact);

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete contact
 * @access  Private (Admin/Manager only)
 */
router.delete('/:id', contactIdValidation, contactController.deleteContact);

/**
 * @route   POST /api/contacts/:id/leads/:leadId
 * @desc    Link contact to lead
 * @access  Private
 */
router.post('/:id/leads/:leadId', linkToLeadValidation, contactController.linkToLead);

/**
 * @route   DELETE /api/contacts/:id/leads/:leadId
 * @desc    Unlink contact from lead
 * @access  Private
 */
router.delete('/:id/leads/:leadId', linkToLeadValidation, contactController.unlinkFromLead);

module.exports = router;

