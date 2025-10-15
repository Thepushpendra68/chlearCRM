const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');

const LEAD_PICKLIST_TYPES = ['source', 'status'];
const CACHE_TTL_SECONDS = 300;

const isValidType = (type) => LEAD_PICKLIST_TYPES.includes(type);

const normalizeValue = (value = '') => {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const buildCacheKey = (companyId, includeInactive) => {
  const scopedCompanyId = companyId || 'global';
  return cache.generateCompanyKey('lead_picklists', scopedCompanyId, { includeInactive });
};

const clearAllLeadPicklistsCache = () => {
  for (const key of cache.cache.keys()) {
    if (key.startsWith('lead_picklists')) {
      cache.delete(key);
    }
  }
};

const sortOptions = (options) => {
  return [...options].sort((a, b) => {
    if (a.sort_order === b.sort_order) {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }
    return a.sort_order - b.sort_order;
  });
};

const fetchOptionsForCompany = async (companyId, includeInactive) => {
  let query = supabaseAdmin
    .from('lead_picklist_options')
    .select('id, company_id, type, value, label, sort_order, is_active, metadata, created_at, updated_at')
    .in('type', LEAD_PICKLIST_TYPES)
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (companyId) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`);
  } else {
    query = query.is('company_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[picklistService] Failed to load lead picklist options', error);
    throw new ApiError('Failed to load lead picklist options', 500, 'PICKLIST_FETCH_FAILED');
  }

  return data;
};

const mergeOptions = (companyId, rows, includeInactive) => {
  const result = {
    sources: [],
    statuses: []
  };

  LEAD_PICKLIST_TYPES.forEach((type) => {
    const typeRows = rows.filter((row) => row.type === type);
    const customRows = typeRows.filter((row) => row.company_id === companyId);
    const globalRows = typeRows.filter((row) => !row.company_id);

    const overrides = new Map();
    customRows.forEach((row) => {
      overrides.set(row.value, row);
    });

    const inactiveValues = new Set(
      customRows.filter((row) => !row.is_active).map((row) => row.value)
    );

    if (includeInactive) {
      const annotated = [];

      sortOptions(customRows).forEach((row) => {
        annotated.push({
          ...row,
          scope: 'custom',
          isOverridden: false
        });
      });

      sortOptions(globalRows).forEach((row) => {
        annotated.push({
          ...row,
          scope: 'global',
          isOverridden: overrides.has(row.value)
        });
      });

      result[type === 'source' ? 'sources' : 'statuses'] = annotated;
      return;
    }

    const merged = [];

    sortOptions(customRows).forEach((row) => {
      if (!row.is_active) {
        return;
      }

      merged.push({
        ...row,
        scope: 'custom'
      });
    });

    sortOptions(globalRows).forEach((row) => {
      if (overrides.has(row.value) || inactiveValues.has(row.value)) {
        return;
      }

      if (!row.is_active) {
        return;
      }

      merged.push({
        ...row,
        scope: 'global'
      });
    });

    result[type === 'source' ? 'sources' : 'statuses'] = sortOptions(merged);
  });

  return result;
};

const getLeadPicklists = async (companyId, { includeInactive = false, forceRefresh = false } = {}) => {
  const cacheKey = buildCacheKey(companyId, includeInactive);

  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const rows = await fetchOptionsForCompany(companyId, includeInactive);
  const merged = mergeOptions(companyId, rows, includeInactive);

  cache.set(cacheKey, merged, CACHE_TTL_SECONDS);
  return merged;
};

const invalidateLeadPicklistsCache = (companyId) => {
  if (!companyId) {
    clearAllLeadPicklistsCache();
    return;
  }

  [true, false].forEach((includeInactive) => {
    const cacheKey = buildCacheKey(companyId, includeInactive);
    cache.delete(cacheKey);
  });
};

const createPicklistOption = async ({ companyId, type, value, label, sortOrder = 0, isActive = true, metadata = {}, createdBy }) => {
  if (!isValidType(type)) {
    throw ApiError.badRequest('Invalid picklist type');
  }

  const normalizedValue = normalizeValue(value || label);

  if (!normalizedValue) {
    throw ApiError.badRequest('Value is required');
  }

  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    throw ApiError.badRequest('Label is required');
  }

  if (metadata !== undefined && (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata))) {
    throw ApiError.badRequest('Metadata must be an object');
  }

  const payload = {
    company_id: companyId || null,
    type,
    value: normalizedValue,
    label: label.trim(),
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active: Boolean(isActive),
    metadata: metadata || {},
    created_by: createdBy || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseAdmin
    .from('lead_picklist_options')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[picklistService] Failed to create picklist option', error);
    if (error.code === '23505') {
      throw ApiError.conflict('Picklist value must be unique');
    }
    throw new ApiError(error.message || 'Failed to create picklist option', 500, 'PICKLIST_CREATE_FAILED');
  }

  invalidateLeadPicklistsCache(companyId);

  return data;
};

const updatePicklistOption = async (optionId, updates, { companyId }) => {
  if (!optionId) {
    throw ApiError.badRequest('Option ID is required');
  }

  const payload = {};

  if (updates.label !== undefined) {
    if (!updates.label || typeof updates.label !== 'string') {
      throw ApiError.badRequest('Label must be a non-empty string');
    }
    payload.label = updates.label.trim();
  }

  if (updates.sortOrder !== undefined) {
    payload.sort_order = Number.isFinite(updates.sortOrder) ? updates.sortOrder : 0;
  }

  if (updates.isActive !== undefined) {
    payload.is_active = Boolean(updates.isActive);
  }

  if (updates.metadata !== undefined) {
    if (updates.metadata === null || typeof updates.metadata !== 'object' || Array.isArray(updates.metadata)) {
      throw ApiError.badRequest('Metadata must be an object');
    }
    payload.metadata = updates.metadata;
  }

  if (updates.value !== undefined) {
    const normalized = normalizeValue(updates.value);
    if (!normalized) {
      throw ApiError.badRequest('Value must produce a non-empty slug');
    }
    payload.value = normalized;
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('lead_picklist_options')
    .update(payload)
    .eq('id', optionId)
    .select()
    .single();

  if (error) {
    console.error('[picklistService] Failed to update picklist option', error);
    if (error.code === '23505') {
      throw ApiError.conflict('Picklist value must be unique');
    }
    throw new ApiError(error.message || 'Failed to update picklist option', 500, 'PICKLIST_UPDATE_FAILED');
  }

  invalidateLeadPicklistsCache(companyId || data.company_id);

  return data;
};

const deletePicklistOption = async (optionId, { companyId }) => {
  if (!optionId) {
    throw ApiError.badRequest('Option ID is required');
  }

  const { error } = await supabaseAdmin
    .from('lead_picklist_options')
    .delete()
    .eq('id', optionId);

  if (error) {
    console.error('[picklistService] Failed to delete picklist option', error);
    throw new ApiError(error.message || 'Failed to delete picklist option', 500, 'PICKLIST_DELETE_FAILED');
  }

  invalidateLeadPicklistsCache(companyId);
};

const reorderPicklistOptions = async (type, orderedIds = [], { companyId }) => {
  if (!isValidType(type)) {
    throw ApiError.badRequest('Invalid picklist type');
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw ApiError.badRequest('Ordered IDs array is required');
  }

  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index + 1,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseAdmin
    .from('lead_picklist_options')
    .upsert(updates, { onConflict: 'id' });

  if (error) {
    console.error('[picklistService] Failed to reorder picklist options', error);
    throw new ApiError(error.message || 'Failed to reorder picklist options', 500, 'PICKLIST_REORDER_FAILED');
  }

  invalidateLeadPicklistsCache(companyId);
};

module.exports = {
  LEAD_PICKLIST_TYPES,
  getLeadPicklists,
  createPicklistOption,
  updatePicklistOption,
  deletePicklistOption,
  reorderPicklistOptions,
  invalidateLeadPicklistsCache,
  normalizeValue
};
