const Fuse = require('fuse.js');

/**
 * Robust date parser that handles multiple common formats.
 * Returns a valid Date object or null if parsing fails.
 * 
 * Supports:
 * - ISO formats: 2025-10-17, 2025-10-17T14:30:00Z
 * - US formats: 10/17/2025, 10-17-2025
 * - European formats: 17/10/2025, 17-10-2025
 * - Text months: Oct 17, 2025 or October 17, 2025
 * - Excel serial numbers (days since 1900)
 * 
 * Rejects:
 * - Invalid dates (e.g., 2025-13-01)
 * - Ambiguous formats without context
 * - Empty strings
 */
const parseDateFlexible = (value) => {
  if (!value) return null;
  
  // If already a Date object, validate it
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // Convert to string and trim whitespace
  const dateStr = String(value).trim();
  if (!dateStr) return null;

  // Try parsing as Excel serial number (common in CSV exports)
  // Excel stores dates as days since 1900-01-01 (with an artificial leap day at 1900-02-29)
  if (/^\d+$/.test(dateStr) && dateStr.length >= 5) {
    const excelSerial = parseInt(dateStr, 10);

    if (excelSerial >= 1 && excelSerial <= 600000) {
      let adjustedSerial = excelSerial;

      if (adjustedSerial >= 60) {
        adjustedSerial -= 1;
      }

      const excelEpoch = Date.UTC(1899, 11, 30);
      const milliseconds = excelEpoch + adjustedSerial * 86400 * 1000;
      const date = new Date(milliseconds);

      if (!Number.isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        if (year >= 1900 && year <= 2100) {
          return date;
        }
      }
    }
  }

  // Try ISO 8601 format first (most reliable)
  // Matches: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, etc.
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const date = new Date(isoMatch[0]);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // Try MM/DD/YYYY or MM-DD-YYYY (US format)
  const usMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (usMatch) {
    const month = parseInt(usMatch[1], 10);
    const day = parseInt(usMatch[2], 10);
    const year = parseInt(usMatch[3], 10);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Validate it's a real date
      const date = new Date(year, month - 1, day);
      // Check if the date components match what we put in
      // This catches invalid dates like Feb 31
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
      }
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY (European format)
  // Only if day > 12 (to avoid ambiguity with US format)
  const euMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (euMatch) {
    const day = parseInt(euMatch[1], 10);
    const month = parseInt(euMatch[2], 10);
    const year = parseInt(euMatch[3], 10);
    
    // Only treat as DD/MM if day > 12 (clearly not a month)
    if (day > 12 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
      }
    }
  }

  // Try parsing text month formats: "Oct 17, 2025" or "17 Oct 2025"
  const textMonthMatch = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i);
  if (textMonthMatch) {
    // Try native Date parsing with English locale
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // Try native Date parsing as last resort (handles many formats)
  // But only if it looks somewhat date-like to avoid false positives
  if (/\d/.test(dateStr)) {
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      // Validate that the parsed date is reasonable (not year 1900, etc.)
      // and that it's actually close to what we parsed
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return date;
      }
    }
  }

  // No valid date format matched
  return null;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const normalizeEmail = (value) => {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizePhone = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  let phone = normalized.replace(/\u00A0/g, ' ').trim();
  let prefix = '';

  if (phone.startsWith('+')) {
    prefix = '+';
    phone = phone.slice(1);
  }

  phone = phone.replace(/\D/g, '');

  if (!phone) {
    return null;
  }

  return prefix + phone;
};

class ImportValidationEngine {
  constructor(config) {
    this.config = config;
    this.fuseInstances = {};
    this.enumMappings = {};
    
    console.log(`[ENGINE_INIT] Creating ImportValidationEngine`);
    console.log(`[ENGINE_INIT] Has fuzzyMatchData? ${!!config.fuzzyMatchData}`);
    if (config.fuzzyMatchData) {
      console.log(`[ENGINE_INIT] FuzzyMatchData fields: ${Object.keys(config.fuzzyMatchData).join(', ')}`);
      if (config.fuzzyMatchData.lead_source) {
        console.log(`[ENGINE_INIT] Lead source labels: ${config.fuzzyMatchData.lead_source.map(d => `${d.label}→${d.value}`).join(', ')}`);
      }
      if (config.fuzzyMatchData.status) {
        console.log(`[ENGINE_INIT] Status labels: ${config.fuzzyMatchData.status.map(d => `${d.label}→${d.value}`).join(', ')}`);
      }
    }

    // Initialize Fuse.js for each enum field with LOWER threshold for more matching
    if (this.config.enums) {
      Object.keys(this.config.enums).forEach(field => {
        const enumList = this.config.enums[field];
        if (Array.isArray(enumList) && enumList.length > 0) {
          this.fuseInstances[field] = new Fuse(enumList, {
            includeScore: true,
            threshold: 0.4, // Lowered from 0.3 - closer to 0 is more similar
            distance: 100,
            minMatchCharLength: 2
          });
        }
      });
    }

    // Initialize enhanced fuzzy matching with both values and labels
    if (this.config.fuzzyMatchData) {
      Object.keys(this.config.fuzzyMatchData).forEach(field => {
        const fuzzyData = this.config.fuzzyMatchData[field];
        if (Array.isArray(fuzzyData) && fuzzyData.length > 0) {
          // Create searchable items with both value and label
          const searchableItems = fuzzyData.map(item => {
            const value = item.value || item;
            const label = item.label || item;
            return {
              value,
              label,
              searchText: `${value} ${label}`.toLowerCase()
            };
          });

          this.fuseInstances[`${field}_enhanced`] = new Fuse(searchableItems, {
            includeScore: true,
            threshold: 0.4, // Lowered from 0.3
            distance: 100,
            minMatchCharLength: 2,
            keys: ['value', 'label', 'searchText']
          });
          console.log(`[ENGINE_INIT] Created enhanced Fuse for ${field} with ${searchableItems.length} items`);
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
        normalized.phone = phone;
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
      const parsedDate = parseDateFlexible(row.expected_close_date);
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

  // NEW: Compute Levenshtein distance for fuzzy matching
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  // NEW: Calculate similarity score (0-1, where 1 is perfect match)
  calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  // NEW: Improved fuzzy matching with multiple strategies
  fuzzyMatch(inputValue, field) {
    const enumList = this.config.enums?.[field];
    if (!Array.isArray(enumList) || enumList.length === 0) {
      return null;
    }

    const lowerInput = inputValue.toString().trim().toLowerCase();
    
    // DEBUG: Log what we're trying to match
    const debugLog = field === 'lead_source' || inputValue === 'Instagram' || inputValue === 'Walk-In';
    if (debugLog) {
      console.log(`\n[FUZZY_MATCH_DEBUG] Field: ${field}, Input: "${inputValue}"`);
      console.log(`[FUZZY_MATCH_DEBUG] Enum list: ${enumList.join(', ')}`);
      console.log(`[FUZZY_MATCH_DEBUG] Has fuzzyMatchData? ${!!this.config.fuzzyMatchData}`);
      if (this.config.fuzzyMatchData && this.config.fuzzyMatchData[field]) {
        console.log(`[FUZZY_MATCH_DEBUG] FuzzyMatchData labels: ${this.config.fuzzyMatchData[field].map(d => `${d.label}→${d.value}`).join(', ')}`);
      }
    }

    // Strategy 1: Exact match (case-insensitive)
    const exactMatch = enumList.find(item => item.toLowerCase() === lowerInput);
    if (exactMatch) {
      if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 1: Exact match found: ${exactMatch}`);
      return exactMatch;
    }

    // Strategy 2: Substring match
    const substringMatch = enumList.find(item => 
      item.toLowerCase().includes(lowerInput) || lowerInput.includes(item.toLowerCase())
    );
    if (substringMatch) {
      if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 2: Substring match found: ${substringMatch}`);
      return substringMatch;
    }

    // Strategy 3: Enhanced fuzzy matching with picklist labels
    const enhancedFuse = this.fuseInstances[`${field}_enhanced`];
    if (enhancedFuse) {
      const results = enhancedFuse.search(lowerInput);
      if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] STRATEGY 3: Fuse search results: ${results.length}, score: ${results[0]?.score}`);
      if (results.length > 0 && results[0].score < 0.5) {
        if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 3: Fuse match found: ${results[0].item.value}`);
        return results[0].item.value;
      }
    }

    // Strategy 4: Direct label matching from fuzzyMatchData
    if (this.config.fuzzyMatchData && this.config.fuzzyMatchData[field]) {
      const fuzzyData = this.config.fuzzyMatchData[field];
      
      // Try exact match on label
      const labelMatch = fuzzyData.find(item => 
        item.label && item.label.toLowerCase() === lowerInput
      );
      if (labelMatch) {
        if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 4A: Label exact match found: ${labelMatch.value}`);
        return labelMatch.value;
      }

      // Try substring match on label
      const labelSubstringMatch = fuzzyData.find(item =>
        (item.label && item.label.toLowerCase().includes(lowerInput)) ||
        (lowerInput.includes(item.label && item.label.toLowerCase()))
      );
      if (labelSubstringMatch) {
        if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 4B: Label substring match found: ${labelSubstringMatch.value}`);
        return labelSubstringMatch.value;
      }
    }

    // Strategy 5: Levenshtein distance matching
    let bestMatch = null;
    let bestScore = 0;
    const threshold = 0.6; // Need 60% similarity minimum

    enumList.forEach(item => {
      const similarity = this.calculateSimilarity(lowerInput, item.toLowerCase());
      if (similarity > bestScore && similarity >= threshold) {
        bestScore = similarity;
        bestMatch = item;
      }
    });

    if (bestMatch) {
      if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 5: Levenshtein match found: ${bestMatch} (${(bestScore*100).toFixed(0)}% similar)`);
      return bestMatch;
    }

    // Strategy 6: Levenshtein on labels from fuzzyMatchData
    if (this.config.fuzzyMatchData && this.config.fuzzyMatchData[field]) {
      const fuzzyData = this.config.fuzzyMatchData[field];
      let bestLabelMatch = null;
      let bestLabelScore = 0;

      fuzzyData.forEach(item => {
        if (item.label) {
          const similarity = this.calculateSimilarity(lowerInput, item.label.toLowerCase());
          if (similarity > bestLabelScore && similarity >= threshold) {
            bestLabelScore = similarity;
            bestLabelMatch = item.value;
          }
        }
      });

      if (bestLabelMatch) {
        if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 6: Label Levenshtein match found: ${bestLabelMatch}`);
        return bestLabelMatch;
      }
    }

    // Strategy 7: Fallback to Fuse.js basic matching
    const fuse = this.fuseInstances[field];
    if (fuse) {
      const results = fuse.search(lowerInput);
      if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] STRATEGY 7: Basic Fuse results: ${results.length}`);
      if (results.length > 0 && results[0].score < 0.5) {
        if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✓ STRATEGY 7: Basic Fuse match found: ${results[0].item}`);
        return results[0].item;
      }
    }

    if (debugLog) console.log(`[FUZZY_MATCH_DEBUG] ✗ NO MATCH FOUND for "${inputValue}"`);
    return null;
  }

  normalizeEnumValue(value, field) {
    if (!value) {
      if (field === 'lead_source') return 'import';
      if (field === 'status') return 'new';
      if (field === 'priority') return 'medium';
      return null;
    }

    // Use improved fuzzy matching
    const match = this.fuzzyMatch(value, field);
    return match || null;
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
    const phoneRegex = /^\+?\d{6,16}$/;
    return phoneRegex.test(phone);
  }
}

module.exports = ImportValidationEngine;
module.exports.parseDateFlexible = parseDateFlexible;
