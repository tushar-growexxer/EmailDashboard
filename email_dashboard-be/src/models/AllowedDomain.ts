import { mongodb } from '../config/mongodb';
import logger from '../config/logger';
import { ObjectId } from 'mongodb';

/**
 * Allowed Domain interface
 */
export interface AllowedDomain {
  _id?: ObjectId;
  domain: string;
  database?: string; // Database/Schema name for this domain
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Allowed Domain model for MongoDB operations
 */
export class AllowedDomainModel {
  private readonly collectionName: string;
  private readonly databaseName: string;

  constructor() {
    // Use EMAIL_DATABASE from .env, fallback to 'maildb'
    this.databaseName = process.env.EMAIL_DATABASE || 'maildb';
    // Use ALLOWED_DOMAINS from .env, fallback to 'ALLOWED_DOMAINS'
    this.collectionName = process.env.ALLOWED_DOMAINS || 'domains';
    
    logger.info(`AllowedDomainModel initialized: database="${this.databaseName}", collection="${this.collectionName}"`);
  }

  /**
   * Get the collection for allowed domains
   */
  private async getCollection() {
    const db = await mongodb.getDatabaseByName(this.databaseName);
    return db.collection(this.collectionName);
  }

  /**
   * Create a new allowed domain
   * @param {string} domain - Domain to add (e.g., 'example.com')
   * @param {string} createdBy - User ID who created this domain
   * @param {string} database - Database/Schema name for this domain (optional)
   * @returns {Promise<AllowedDomain>} Created domain object
   */
  async create(domain: string, createdBy?: string, database?: string): Promise<AllowedDomain> {
    try {
      const collection = await this.getCollection();
      
      // Normalize domain (lowercase, remove www, etc.)
      const normalizedDomain = this.normalizeDomain(domain);
      
      // Check if domain already exists
      const existing = await collection.findOne({ domain: normalizedDomain });
      if (existing) {
        throw new Error(`Domain ${normalizedDomain} already exists`);
      }

      const domainData: AllowedDomain = {
        domain: normalizedDomain,
        database: database?.trim() || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
      };

      const result = await collection.insertOne(domainData);
      
      logger.info(`Allowed domain created: ${normalizedDomain}${database ? ` with database: ${database}` : ''}`);
      return { ...domainData, _id: result.insertedId };
    } catch (error) {
      logger.error('Error creating allowed domain:', error);
      throw error;
    }
  }

  /**
   * Update a domain by ID
   * @param {string} domainId - MongoDB ObjectId of the domain
   * @param {Partial<AllowedDomain>} updates - Fields to update
   * @returns {Promise<AllowedDomain | null>} Updated domain object or null if not found
   */
  async updateById(domainId: string, updates: Partial<AllowedDomain>): Promise<AllowedDomain | null> {
    try {
      const collection = await this.getCollection();
      
      // Remove _id from updates if present
      const { _id, ...updateFields } = updates;
      
      const updateData: any = {
        ...updateFields,
        updatedAt: new Date(),
      };
      
      // Normalize domain if provided
      if (updateData.domain) {
        updateData.domain = this.normalizeDomain(updateData.domain);
      }
      
      // Trim database if provided
      if (updateData.database !== undefined) {
        updateData.database = updateData.database?.trim() || undefined;
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(domainId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (result) {
        logger.info(`Allowed domain updated: ${domainId}`);
        return result as AllowedDomain;
      }
      
      return null;
    } catch (error) {
      logger.error('Error updating allowed domain:', error);
      throw error;
    }
  }

  /**
   * Get all allowed domains
   * @returns {Promise<AllowedDomain[]>} Array of allowed domains
   */
  async findAll(): Promise<AllowedDomain[]> {
    try {
      const collection = await this.getCollection();
      const domains = await collection.find({}).sort({ domain: 1 }).toArray();
      return domains as AllowedDomain[];
    } catch (error) {
      logger.error('Error finding all allowed domains:', error);
      throw error;
    }
  }

  /**
   * Find a domain by domain string
   * @param {string} domain - Domain to search for
   * @returns {Promise<AllowedDomain | null>} Domain object or null if not found
   */
  async findByDomain(domain: string): Promise<AllowedDomain | null> {
    try {
      const collection = await this.getCollection();
      const normalizedDomain = this.normalizeDomain(domain);
      const result = await collection.findOne({ domain: normalizedDomain });
      return result as AllowedDomain | null;
    } catch (error) {
      logger.error('Error finding domain by domain string:', error);
      throw error;
    }
  }

  /**
   * Check if a domain is allowed
   * @param {string} email - Email address to check
   * @returns {Promise<boolean>} True if domain is allowed, false otherwise
   */
  async isDomainAllowed(email: string): Promise<boolean> {
    try {
      const emailDomain = this.extractDomainFromEmail(email);
      const normalizedDomain = this.normalizeDomain(emailDomain);
      
      logger.info(`Checking domain: ${emailDomain} -> normalized: ${normalizedDomain}`);
      logger.info(`Using database: ${this.databaseName}, collection: ${this.collectionName}`);
      
      const collection = await this.getCollection();
      
      // Also check all domains for debugging
      const allDomains = await collection.find({}).toArray();
      logger.info(`Found ${allDomains.length} domains in database:`, allDomains.map(d => d.domain));
      
      const result = await collection.findOne({ domain: normalizedDomain });
      logger.info(`Domain check result for ${normalizedDomain}:`, result ? 'ALLOWED' : 'NOT ALLOWED');
      
      return !!result;
    } catch (error) {
      logger.error('Error checking if domain is allowed:', error);
      return false;
    }
  }

  /**
   * Delete a domain by ID
   * @param {string} domainId - MongoDB ObjectId of the domain
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteById(domainId: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(domainId) });
      
      if (result.deletedCount > 0) {
        logger.info(`Allowed domain deleted: ${domainId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting allowed domain:', error);
      throw error;
    }
  }

  /**
   * Delete a domain by domain string
   * @param {string} domain - Domain to delete
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteByDomain(domain: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const normalizedDomain = this.normalizeDomain(domain);
      const result = await collection.deleteOne({ domain: normalizedDomain });
      
      if (result.deletedCount > 0) {
        logger.info(`Allowed domain deleted: ${normalizedDomain}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting allowed domain:', error);
      throw error;
    }
  }

  /**
   * Normalize domain string (lowercase, remove www, etc.)
   * @param {string} domain - Domain to normalize
   * @returns {string} Normalized domain
   */
  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().trim().replace(/^www\./, '');
  }

  /**
   * Extract domain from email address
   * @param {string} email - Email address
   * @returns {string} Domain part of email
   */
  private extractDomainFromEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Invalid email format');
    }
    return parts[1];
  }
}

// Export singleton instance
export const allowedDomainModel = new AllowedDomainModel();
export default allowedDomainModel;

