import NodeCache = require('node-cache');
import logger from '../config/logger';

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  invalidationHour: number; // Hour when cache invalidates (0-23)
  invalidationMinute: number; // Minute when cache invalidates (0-59)
  checkPeriod: number; // Check period in seconds for expired keys
}

/**
 * Cache entry metadata for tracking
 */
interface CacheMetadata {
  cachedAt: Date;
  expiresAt: Date;
  invalidatesAt: Date; // Next 7 AM
}

/**
 * Enhanced cache service using node-cache
 * Automatically invalidates cache at 7 AM daily, even if server was down
 */
class CacheService {
  private cache: NodeCache;
  private config: CacheConfig;
  private metadata: Map<string, CacheMetadata>;
  private refreshTimer: NodeJS.Timeout | null = null;
  private validationTimer: NodeJS.Timeout | null = null;

  constructor() {
    const invalidationHour = parseInt(process.env.CACHE_INVALIDATION_HOUR || '7');
    const invalidationMinute = parseInt(process.env.CACHE_INVALIDATION_MINUTE || '0');
    
    this.config = {
      invalidationHour,
      invalidationMinute,
      checkPeriod: 600, // Check every 10 minutes
    };

    // Initialize node-cache with very long TTL (we handle invalidation manually)
    this.cache = new NodeCache({
      stdTTL: 0, // No automatic expiration (we handle it manually)
      checkperiod: this.config.checkPeriod,
      useClones: false, // Better performance
    });

    this.metadata = new Map();

    logger.info(`Cache service initialized. Invalidation time: ${invalidationHour}:${String(invalidationMinute).padStart(2, '0')}`);

    // Schedule automatic cache refresh at 7 AM
    this.scheduleRefresh();

    // Start periodic validation (checks every minute for 7 AM boundary)
    this.startPeriodicValidation();
  }

  /**
   * Calculate next invalidation time (next 7 AM)
   */
  private getNextInvalidationTime(): Date {
    const now = new Date();
    const next = new Date(now);
    next.setHours(this.config.invalidationHour, this.config.invalidationMinute, 0, 0);

    // If invalidation time has passed today, set to tomorrow
    if (now >= next) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Check if cache should be invalidated (past 7 AM since cache time)
   */
  private shouldInvalidate(cachedAt: Date): boolean {
    const now = new Date();
    const todayInvalidation = new Date(now);
    todayInvalidation.setHours(this.config.invalidationHour, this.config.invalidationMinute, 0, 0);

    // If cache was set before today's invalidation time and we're past it
    if (cachedAt < todayInvalidation && now >= todayInvalidation) {
      return true;
    }

    // If cache is from a previous day
    if (cachedAt.toDateString() !== now.toDateString()) {
      return now >= todayInvalidation;
    }

    return false;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {T} data - Data to cache
   */
  set<T>(key: string, data: T): void {
    const now = new Date();
    const invalidatesAt = this.getNextInvalidationTime();

    // Store data in node-cache
    this.cache.set(key, data);

    // Store metadata separately
    this.metadata.set(key, {
      cachedAt: now,
      expiresAt: invalidatesAt,
      invalidatesAt,
    });

    logger.info(
      `[Cache SET] Key: ${key}, Cached at: ${now.toISOString()}, ` +
      `Invalidates at: ${invalidatesAt.toISOString()}`
    );
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {T | null} Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    // Check if key exists
    if (!this.cache.has(key)) {
      logger.debug(`[Cache MISS] Key: ${key} - Not found`);
      return null;
    }

    // Check metadata for invalidation
    const meta = this.metadata.get(key);
    if (meta && this.shouldInvalidate(meta.cachedAt)) {
      logger.info(
        `[Cache INVALIDATED] Key: ${key} - Crossed ${this.config.invalidationHour}:${this.config.invalidationMinute} boundary`
      );
      this.delete(key);
      return null;
    }

    const data = this.cache.get<T>(key);
    if (data !== undefined) {
      logger.debug(`[Cache HIT] Key: ${key}`);
      return data;
    }

    logger.debug(`[Cache MISS] Key: ${key} - Data undefined`);
    return null;
  }

  /**
   * Check if cache has valid data for key
   * @param {string} key - Cache key
   * @returns {boolean} True if valid cache exists
   */
  has(key: string): boolean {
    if (!this.cache.has(key)) {
      return false;
    }

    // Check if should be invalidated
    const meta = this.metadata.get(key);
    if (meta && this.shouldInvalidate(meta.cachedAt)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  delete(key: string): void {
    this.cache.del(key);
    this.metadata.delete(key);
    logger.info(`[Cache DELETE] Key: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
    this.metadata.clear();
    logger.info('[Cache CLEAR] All cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    const now = new Date();
    
    const stats = {
      totalEntries: keys.length,
      keys: this.cache.keys(),
      entries: [] as any[],
      nextInvalidation: this.getNextInvalidationTime().toISOString(),
    };

    keys.forEach((key: string) => {
      const meta = this.metadata.get(key);
      
      if (meta) {
        const age = Math.floor((now.getTime() - meta.cachedAt.getTime()) / 1000 / 60); // Age in minutes
        const ttl = Math.floor((meta.invalidatesAt.getTime() - now.getTime()) / 1000 / 60); // TTL in minutes

        stats.entries.push({
          key,
          age: `${age} minutes`,
          ttl: ttl > 0 ? `${ttl} minutes` : 'expired',
          cachedAt: meta.cachedAt.toISOString(),
          invalidatesAt: meta.invalidatesAt.toISOString(),
          isValid: !this.shouldInvalidate(meta.cachedAt),
        });
      } else {
        stats.entries.push({
          key,
          age: 'unknown',
          ttl: 'unknown',
          cachedAt: 'unknown',
          invalidatesAt: 'unknown',
          isValid: true,
        });
      }
    });

    return stats;
  }

  /**
   * Calculate milliseconds until next invalidation time
   * @returns {number} Milliseconds until next invalidation
   */
  private getMillisecondsUntilInvalidation(): number {
    const next = this.getNextInvalidationTime();
    const now = new Date();
    return next.getTime() - now.getTime();
  }

  /**
   * Schedule automatic cache refresh at invalidation time (7 AM)
   */
  private scheduleRefresh(): void {
    const msUntilRefresh = this.getMillisecondsUntilInvalidation();
    const minutes = Math.floor(msUntilRefresh / 1000 / 60);
    
    logger.info(
      `[Cache Schedule] Automatic cache clear scheduled at ` +
      `${this.config.invalidationHour}:${String(this.config.invalidationMinute).padStart(2, '0')} ` +
      `(in ${minutes} minutes)`
    );

    this.refreshTimer = setTimeout(() => {
      logger.info('[Cache Auto-Clear] Automatic cache clear triggered at invalidation time');
      this.clear();
      
      // Schedule next refresh (next day)
      this.scheduleRefresh();
    }, msUntilRefresh);
  }

  /**
   * Start periodic validation to check for cache invalidation
   * Checks every minute if any cached items have crossed the 7 AM boundary
   */
  private startPeriodicValidation(): void {
    this.validationTimer = setInterval(() => {
      const keys = this.cache.keys();
      let invalidatedCount = 0;

      keys.forEach((key: string) => {
        const meta = this.metadata.get(key);
        if (meta && this.shouldInvalidate(meta.cachedAt)) {
          logger.info(`[Cache Validation] Invalidating key: ${key} (crossed invalidation boundary)`);
          this.delete(key);
          invalidatedCount++;
        }
      });

      if (invalidatedCount > 0) {
        logger.info(`[Cache Validation] Invalidated ${invalidatedCount} expired cache entries`);
      }
    }, 60000); // Check every minute

    logger.info('[Cache Validation] Periodic validation started (checks every 60 seconds)');
  }

  /**
   * Stop scheduled refresh and validation
   */
  stopRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('[Cache Schedule] Scheduled refresh stopped');
    }

    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
      logger.info('[Cache Validation] Periodic validation stopped');
    }
  }

  /**
   * Get cache configuration
   * @returns {CacheConfig} Current cache configuration
   */
  getConfig(): CacheConfig {
    return this.config;
  }

  /**
   * Get cache keys
   * @returns {string[]} Array of cache keys
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get node-cache instance statistics
   */
  getNodeCacheStats() {
    return this.cache.getStats();
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;

