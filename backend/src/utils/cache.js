/**
 * Simple in-memory cache with TTL (Time To Live) support
 * For development use - in production, consider Redis or similar
 */

class Cache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  /**
   * Set a value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    // Clear existing timeout if key exists
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Store value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });

    // Set expiration timeout
    const timeout = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timeouts.set(key, timeout);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key to delete
   */
  delete(key) {
    this.cache.delete(key);

    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }

    this.cache.clear();
    this.timeouts.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  /**
   * Generate cache key for user-specific data
   * @param {string} operation - Operation name
   * @param {object} user - User object
   * @param {object} params - Additional parameters
   * @returns {string} Cache key
   */
  generateUserKey(operation, user, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${operation}:${user.company_id}:${user.id || 'anon'}:${paramStr}`;
  }

  /**
   * Generate cache key for company-wide data
   * @param {string} operation - Operation name
   * @param {string} companyId - Company ID
   * @param {object} params - Additional parameters
   * @returns {string} Cache key
   */
  generateCompanyKey(operation, companyId, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${operation}:${companyId}:${paramStr}`;
  }
}

// Export singleton instance
module.exports = new Cache();