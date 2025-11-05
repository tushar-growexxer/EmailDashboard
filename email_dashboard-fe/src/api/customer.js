import BaseApiService from './base';

/**
 * Customer API Service
 * Handles customer sales data API calls
 */
class CustomerApiService extends BaseApiService {
  constructor() {
    super();
    this.endpoint = '/customers';
  }

  /**
   * Get all customer sales data
   * @returns {Promise<Object>} Customer sales data
   */
  async getAllCustomers() {
    return this.get(`${this.endpoint}/sales`);
  }

  /**
   * Search customers by name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} Search results
   */
  async searchCustomers(searchTerm, limit = 10) {
    const params = new URLSearchParams({
      q: searchTerm,
      limit: limit.toString(),
    });
    return this.get(`${this.endpoint}/search?${params}`);
  }

  /**
   * Get customer by CardCode
   * @param {string} cardCode - Customer card code
   * @returns {Promise<Object>} Customer data
   */
  async getCustomerByCardCode(cardCode) {
    return this.get(`${this.endpoint}/${cardCode}`);
  }

  /**
   * Refresh customer sales cache
   * @returns {Promise<Object>} Refresh status
   */
  async refreshCache() {
    return this.post(`${this.endpoint}/refresh-cache`);
  }

  /**
   * Get cache status
   * @returns {Promise<Object>} Cache status
   */
  async getCacheStatus() {
    return this.get(`${this.endpoint}/cache-status`);
  }
}

export default new CustomerApiService();
