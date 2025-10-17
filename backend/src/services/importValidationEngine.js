const Fuse = require('fuse.js');

const parseISO = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const normalizeEmail = (value) => {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizePhone = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  return normalized.replace(/[\s\-()]/g, '');
};

class ImportValidationEngine {
  constructor(config) {
    this.config = config;
    this.fuseInstances = {};

    // Initialize Fuse.js for each enum field
    if (this.config.enums) {
      Object.keys(this.config.enums).forEach(field => {
        const enumList = this.config.enums[field];
        if (Array.isArray(enumList) && enumList.length > 0) {
          this.fuseInstances[field] = new Fuse(enumList, {
            includeScore: true,
            threshold: 0.3, // Stricter threshold, closer to 0 is more similar
          });
        }
      });
    }
  }

  validateRows(rows, context) {
    const results = [];

    rows.forEach((row, index) => {
      const evaluation = this.validateRow(row, index, context);
      results.push(evaluation);
    });

    return results;
  }

  validateRow(row, index, context) {
    const errors = [];
    const warnings = [];
    const normalized = {};

    const raw = { ...row };
    const rowNumber = index + 1;

    this.config.requiredFields.forEach((field) => {
      if (!normalizeString(row[field])) {
        errors.push(`${field} is required`);
      }
    });

    if (row.email) {
      const email = normalizeEmail(row.email);
      if (!this.isValidEmail(email)) {
        errors.push('Invalid email format');
      } else {
        normalized.email = email;
        if (context.duplicates.inFile.emails.has(email)) {
          errors.push('Duplicate email found in import file');
        } else if (context.duplicates.inDb.emails.has(email)) {
          context.duplicates.inFile.emails.add(email);
          errors.push('Email already exists');
        } else {
          context.duplicates.inFile.emails.add(email);
        }
      }
    }

    if (row.phone) {
      const phone = normalizePhone(row.phone);
      if (!this.isValidPhone(phone)) {
        errors.push('Invalid phone format');
      } else {
        normalized.phone = row.phone.trim();
        if (context.duplicates.inFile.phones.has(phone)) {
          errors.push('Duplicate phone found in import file');
        } else if (context.duplicates.inDb.phones.has(phone)) {
          context.duplicates.inFile.phones.add(phone);
          warnings.push('Phone already exists');
        } else {
          context.duplicates.inFile.phones.add(phone);
        }
      }
    }

    this.validateEnumerations(row, errors);
    this.validateNumericRanges(row, errors);

    const dealValue = this.parseNumber(row.deal_value);
    if (dealValue !== null) {
      normalized.deal_value = dealValue;
    }

    const probability = this.parseInteger(row.probability);
    if (probability !== null) {
      normalized.probability = probability;
    }

    if (row.expected_close_date) {
      const parsedDate = parseISO(row.expected_close_date);
      if (!parsedDate) {
        errors.push('Invalid expected close date');
      } else {
        normalized.expected_close_date = parsedDate;
      }
    }

    const normalizedRow = {
      ...row,
      first_name: normalizeString(row.first_name),
      last_name: normalizeString(row.last_name),
      email: normalized.email || normalizeEmail(row.email),
      phone: normalized.phone || normalizeString(row.phone),
      company: normalizeString(row.company),
      job_title: normalizeString(row.job_title),
      lead_source: this.normalizeEnumValue(row.lead_source, 'lead_source'),
      status: this.normalizeEnumValue(row.status, 'status'),
      priority: this.normalizeEnumValue(row.priority, 'priority'),
      deal_value: normalized.deal_value ?? null,
      probability: normalized.probability ?? 0,
      expected_close_date: normalized.expected_close_date || null,
      notes: normalizeString(row.notes)
    };

    return {
      rowNumber,
      raw,
      normalized: normalizedRow,
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }

  validateEnumerations(row, errors) {
    const enumConfig = this.config.enums || {};
    ['status', 'lead_source', 'priority'].forEach((field) => {
      const value = row[field];
      if (!value) return;
      const normalized = this.normalizeEnumValue(value, field);
      if (!normalized) {
        errors.push(`Invalid ${field}. Allowed values: ${enumConfig[field].join(', ')}`);
      }
    });
  }

  validateNumericRanges(row, errors) {
    const ranges = this.config.numericRanges || {};

    if (row.deal_value !== undefined && row.deal_value !== null && row.deal_value !== '') {
      const parsed = this.parseNumber(row.deal_value);
      if (parsed === null || (ranges.deal_value?.min !== undefined && parsed < ranges.deal_value.min)) {
        errors.push('Deal value must be a positive number');
      }
    }

    if (row.probability !== undefined && row.probability !== null && row.probability !== '') {
      const parsed = this.parseInteger(row.probability);
      const { min = 0, max = 100 } = ranges.probability || {};
      if (
        parsed === null ||
        parsed < min ||
        parsed > max
      ) {
        errors.push(`Probability must be between ${min} and ${max}`);
      }
    }
  }

  normalizeEnumValue(value, field) {
    if (!value) {
      if (field === 'lead_source') return 'import';
      if (field === 'status') return 'new';
      if (field === 'priority') return 'medium';
      return null;
    }

    const enumList = this.config.enums?.[field];
    if (!Array.isArray(enumList) || enumList.length === 0) {
      return value.toString().trim().toLowerCase();
    }

    const lowerValue = value.toString().trim().toLowerCase();
    if (enumList.includes(lowerValue)) {
      return lowerValue;
    }

    // Fuzzy matching with Fuse.js
    const fuse = this.fuseInstances[field];
    if (fuse) {
      const results = fuse.search(lowerValue);
      if (results.length > 0) {
        // score: 0 is perfect match, 1 is complete mismatch
        // We accept if score is below the threshold
        if (results[0].score < fuse.options.threshold) {
          return results[0].item;
        }
      }
    }

    return null; // Return null if no exact or close match is found
  }

  parseNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  parseInteger(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
  }
}

module.exports = ImportValidationEngine;
