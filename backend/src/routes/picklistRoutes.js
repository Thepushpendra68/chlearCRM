const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');
const picklistController = require('../controllers/picklistController');
const {
  createLeadPicklistValidators,
  updateLeadPicklistValidators,
  reorderLeadPicklistValidators
} = require('../validators/picklistValidators');

const router = express.Router();

// List endpoint uses optionalAuth (works without login for global picklists)
router.get('/leads', optionalAuth, picklistController.listLeadPicklists);

// All modification endpoints require authentication
router.post(
  '/leads',
  authenticate,
  authorize(['company_admin', 'manager', 'super_admin']),
  createLeadPicklistValidators,
  picklistController.createLeadPicklistOption
);

router.put(
  '/leads/:id',
  authenticate,
  authorize(['company_admin', 'manager', 'super_admin']),
  updateLeadPicklistValidators,
  picklistController.updateLeadPicklistOption
);

router.delete(
  '/leads/:id',
  authenticate,
  authorize(['company_admin', 'manager', 'super_admin']),
  picklistController.deleteLeadPicklistOption
);

router.put(
  '/leads/reorder',
  authenticate,
  authorize(['company_admin', 'manager', 'super_admin']),
  reorderLeadPicklistValidators,
  picklistController.reorderLeadPicklistOptions
);

module.exports = router;
