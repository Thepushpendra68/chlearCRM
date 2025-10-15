const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const picklistController = require('../controllers/picklistController');
const {
  createLeadPicklistValidators,
  updateLeadPicklistValidators,
  reorderLeadPicklistValidators
} = require('../validators/picklistValidators');

const router = express.Router();

router.use(authenticate);

router.get('/leads', picklistController.listLeadPicklists);

router.post(
  '/leads',
  authorize(['company_admin', 'manager', 'super_admin']),
  createLeadPicklistValidators,
  picklistController.createLeadPicklistOption
);

router.put(
  '/leads/:id',
  authorize(['company_admin', 'manager', 'super_admin']),
  updateLeadPicklistValidators,
  picklistController.updateLeadPicklistOption
);

router.delete(
  '/leads/:id',
  authorize(['company_admin', 'manager', 'super_admin']),
  picklistController.deleteLeadPicklistOption
);

router.put(
  '/leads/reorder',
  authorize(['company_admin', 'manager', 'super_admin']),
  reorderLeadPicklistValidators,
  picklistController.reorderLeadPicklistOptions
);

module.exports = router;
