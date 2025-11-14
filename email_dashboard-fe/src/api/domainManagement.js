import BaseApiService from './base.js';

/**
 * Domain Management API service
 */
class DomainManagementApiService extends BaseApiService {
  /**
   * Get all allowed domains
   * @returns {Promise<Object>} Allowed domains list
   */
  async getAllDomains() {
    return this.get('/domains');
  }

  /**
   * Add a new allowed domain
   * @param {string} domain - Domain to add (e.g., 'example.com')
   * @param {string} database - Database/Schema name (optional)
   * @returns {Promise<Object>} Created domain object
   */
  async addDomain(domain, database) {
    return this.post('/domains', { domain, database });
  }

  /**
   * Update a domain
   * @param {string} domainId - MongoDB ObjectId of the domain
   * @param {Object} updates - Fields to update (domain, database)
   * @returns {Promise<Object>} Updated domain object
   */
  async updateDomain(domainId, updates) {
    return this.put(`/domains/${domainId}`, updates);
  }

  /**
   * Delete a domain
   * @param {string} domainId - MongoDB ObjectId of the domain
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteDomain(domainId) {
    return this.delete(`/domains/${domainId}`);
  }

  /**
   * Check if an email domain is allowed
   * @param {string} email - Email address to check
   * @returns {Promise<Object>} Check result with isAllowed boolean
   */
  async checkDomain(email) {
    return this.post('/domains/check', { email });
  }
}

// Export singleton instance
const domainManagementApi = new DomainManagementApiService();
export { DomainManagementApiService };
export default domainManagementApi;

