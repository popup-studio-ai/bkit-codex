'use strict';

const DEFAULT_TTL = 5000; // 5 seconds

const _cache = new Map();

/**
 * Get a value from cache. Returns undefined if expired or missing.
 * @param {string} key
 * @returns {*} Cached value or undefined
 */
function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set a value in cache with TTL.
 * @param {string} key
 * @param {*} value
 * @param {number} [ttl=5000] - Time to live in milliseconds
 */
function setCache(key, value, ttl = DEFAULT_TTL) {
  _cache.set(key, {
    value,
    expiresAt: Date.now() + ttl
  });
}

/**
 * Invalidate a specific cache entry.
 * @param {string} key
 */
function invalidateCache(key) {
  _cache.delete(key);
}

/**
 * Clear all cached entries.
 */
function clearCache() {
  _cache.clear();
}

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  clearCache
};
