import { allowedDomainModel, AllowedDomain } from '../models/AllowedDomain';
import logger from '../config/logger';

/**
 * Domain Management Service
 */
export class DomainManagementService {
  /**
   * Get all allowed domains
   * @returns {Promise<AllowedDomain[]>} Array of allowed domains
   */
  async getAllDomains(): Promise<AllowedDomain[]> {
    try {
      return await allowedDomainModel.findAll();
    } catch (error) {
      logger.error('Error getting all domains:', error);
      throw error;
    }
  }

  /**
   * Add a new allowed domain
   * @param {string} domain - Domain to add
   * @param {string} createdBy - User ID who created this domain
   * @param {string} database - Database/Schema name for this domain (optional)
   * @returns {Promise<AllowedDomain>} Created domain object
   */
  async addDomain(domain: string, createdBy?: string, database?: string): Promise<AllowedDomain> {
    try {
      // Validate domain format
      if (!this.isValidDomain(domain)) {
        throw new Error('Invalid domain format');
      }

      return await allowedDomainModel.create(domain, createdBy, database);
    } catch (error) {
      logger.error('Error adding domain:', error);
      throw error;
    }
  }

  /**
   * Update a domain
   * @param {string} domainId - MongoDB ObjectId of the domain
   * @param {Partial<AllowedDomain>} updates - Fields to update
   * @returns {Promise<AllowedDomain | null>} Updated domain object or null if not found
   */
  async updateDomain(domainId: string, updates: Partial<AllowedDomain>): Promise<AllowedDomain | null> {
    try {
      return await allowedDomainModel.updateById(domainId, updates);
    } catch (error) {
      logger.error('Error updating domain:', error);
      throw error;
    }
  }

  /**
   * Delete a domain
   * @param {string} domainId - MongoDB ObjectId of the domain
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteDomain(domainId: string): Promise<boolean> {
    try {
      return await allowedDomainModel.deleteById(domainId);
    } catch (error) {
      logger.error('Error deleting domain:', error);
      throw error;
    }
  }

  /**
   * Check if an email domain is allowed
   * @param {string} email - Email address to check
   * @returns {Promise<boolean>} True if domain is allowed, false otherwise
   */
  async isEmailDomainAllowed(email: string): Promise<boolean> {
    try {
      return await allowedDomainModel.isDomainAllowed(email);
    } catch (error) {
      logger.error('Error checking if email domain is allowed:', error);
      return false;
    }
  }

  /**
   * Validate domain format
   * @param {string} domain - Domain to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidDomain(domain: string): boolean {
    // Basic domain validation regex
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain) || domainRegex.test(domain.replace(/^www\./, ''));
  }
}

// Export singleton instance
export const domainManagementService = new DomainManagementService();
export default domainManagementService;

