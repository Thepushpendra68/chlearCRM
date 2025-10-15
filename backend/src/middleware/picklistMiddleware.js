const { getLeadPicklists } = require('../services/picklistService');

const loadLeadPicklists = async (req, res, next) => {
  try {
    const companyId = req.user?.company_id || null;
    req.leadPicklists = await getLeadPicklists(companyId, { includeInactive: false });
    next();
  } catch (error) {
    next(error);
  }
};

const loadLeadPicklistsWithInactive = async (req, res, next) => {
  try {
    const companyId = req.user?.company_id || null;
    req.leadPicklists = await getLeadPicklists(companyId, { includeInactive: true });
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadLeadPicklists,
  loadLeadPicklistsWithInactive
};
