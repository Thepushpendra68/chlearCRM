import api from './api';

/**
 * Get all contacts with pagination and filters
 */
const getContacts = async (params = {}) => {
  const response = await api.get('/contacts', { params });
  return response.data;
};

/**
 * Get contact by ID
 */
const getContactById = async (id) => {
  const response = await api.get(`/contacts/${id}`);
  return response.data;
};

/**
 * Create new contact
 */
const createContact = async (contactData) => {
  const response = await api.post('/contacts', contactData);
  return response.data;
};

/**
 * Update contact
 */
const updateContact = async (id, contactData) => {
  const response = await api.put(`/contacts/${id}`, contactData);
  return response.data;
};

/**
 * Delete contact
 */
const deleteContact = async (id) => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};

/**
 * Link contact to lead
 */
const linkToLead = async (contactId, leadId, options = {}) => {
  const response = await api.post(`/contacts/${contactId}/leads/${leadId}`, options);
  return response.data;
};

/**
 * Unlink contact from lead
 */
const unlinkFromLead = async (contactId, leadId) => {
  const response = await api.delete(`/contacts/${contactId}/leads/${leadId}`);
  return response.data;
};

/**
 * Find duplicate contacts
 */
const findDuplicates = async (searchCriteria) => {
  const response = await api.post('/contacts/duplicates', searchCriteria);
  return response.data;
};

/**
 * Get contact statistics
 */
const getContactStats = async () => {
  const response = await api.get('/contacts/stats');
  return response.data;
};

const contactService = {
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

export default contactService;

