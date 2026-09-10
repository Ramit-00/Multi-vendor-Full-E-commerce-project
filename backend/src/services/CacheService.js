const redisClient = require('../config/redis');
const crypto = require('crypto');

class CacheService {
  /**
   * Deterministically hash query parameters for catalog caching
   */
  hashQuery(queryObj = {}) {
    try {
      const sortedKeys = Object.keys(queryObj).sort();
      const parts = sortedKeys.map(k => `${k}=${queryObj[k]}`);
      const str = parts.join('&');
      return crypto.createHash('md5').update(str).digest('hex');
    } catch {
      return 'default';
    }
  }

  // --- Product & Catalog Caching ---

  async getProduct(productId) {
    if (!productId) return null;
    return await redisClient.get(`product:${productId}`);
  }

  async setProduct(productId, productData, ttlSeconds = 600) {
    if (!productId || !productData) return false;
    return await redisClient.set(`product:${productId}`, productData, ttlSeconds);
  }

  async invalidateProduct(productId) {
    if (!productId) return false;
    await redisClient.del(`product:${productId}`);
    await this.invalidateCatalog();
    return true;
  }

  async getCatalog(queryHash) {
    return await redisClient.get(`catalog:${queryHash}`);
  }

  async setCatalog(queryHash, catalogData, ttlSeconds = 300) {
    return await redisClient.set(`catalog:${queryHash}`, catalogData, ttlSeconds);
  }

  async invalidateCatalog() {
    return await redisClient.delPattern('catalog:*');
  }

  // --- Deals & Homepage Caching ---

  async getHomeDeals() {
    return await redisClient.get('home:deals');
  }

  async setHomeDeals(deals, ttlSeconds = 900) {
    return await redisClient.set('home:deals', deals, ttlSeconds);
  }

  async invalidateHomeDeals() {
    return await redisClient.del('home:deals');
  }

  async getHomeCategories() {
    return await redisClient.get('home:categories');
  }

  async setHomeCategories(categories, ttlSeconds = 900) {
    return await redisClient.set('home:categories', categories, ttlSeconds);
  }

  async invalidateHomeCategories() {
    return await redisClient.del('home:categories');
  }

  // --- OTP Verification Storage with Native TTL ---

  async setOtp(email, otp, ttlSeconds = 600) {
    if (!email || !otp) return false;
    const cleanEmail = email.toLowerCase().trim();
    return await redisClient.set(`otp:${cleanEmail}`, String(otp), ttlSeconds);
  }

  async getOtp(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    const val = await redisClient.get(`otp:${cleanEmail}`);
    return val !== null && val !== undefined ? String(val) : null;
  }

  async deleteOtp(email) {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return await redisClient.del(`otp:${cleanEmail}`);
  }
}

module.exports = new CacheService();
