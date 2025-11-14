import { Request, Response } from 'express';
import { domainManagementService } from '../services/domainManagement.service';
import logger from '../config/logger';

/**
 * Domain Management Controller
 */
export class DomainManagementController {
  /**
   * Get all allowed domains
   * GET /api/v1/domains
   */
  async getAllDomains(_req: Request, res: Response): Promise<void> {
    try {
      const domains = await domainManagementService.getAllDomains();
      
      res.json({
        success: true,
        data: domains,
      });
    } catch (error) {
      logger.error('Error getting all domains:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve domains',
      });
    }
  }

  /**
   * Add a new allowed domain
   * POST /api/v1/domains
   */
  async addDomain(req: Request, res: Response): Promise<void> {
    try {
      const { domain, database } = req.body;
      const userId = req.user?.userId?.toString();

      if (!domain || typeof domain !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Domain is required',
        });
        return;
      }

      const createdDomain = await domainManagementService.addDomain(domain, userId, database);
      
      res.status(201).json({
        success: true,
        data: createdDomain,
        message: 'Domain added successfully',
      });
    } catch (error: any) {
      logger.error('Error adding domain:', error);
      
      if (error.message === 'Invalid domain format') {
        res.status(400).json({
          success: false,
          message: 'Invalid domain format',
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add domain',
      });
    }
  }

  /**
   * Update a domain
   * PUT /api/v1/domains/:id
   */
  async updateDomain(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { domain, database } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Domain ID is required',
        });
        return;
      }

      const updates: any = {};
      if (domain !== undefined) updates.domain = domain;
      if (database !== undefined) updates.database = database;

      const updatedDomain = await domainManagementService.updateDomain(id, updates);
      
      if (updatedDomain) {
        res.json({
          success: true,
          data: updatedDomain,
          message: 'Domain updated successfully',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }
    } catch (error) {
      logger.error('Error updating domain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update domain',
      });
    }
  }

  /**
   * Delete a domain
   * DELETE /api/v1/domains/:id
   */
  async deleteDomain(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Domain ID is required',
        });
        return;
      }

      const deleted = await domainManagementService.deleteDomain(id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Domain deleted successfully',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }
    } catch (error) {
      logger.error('Error deleting domain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete domain',
      });
    }
  }

  /**
   * Check if an email domain is allowed
   * POST /api/v1/domains/check
   */
  async checkDomain(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const isAllowed = await domainManagementService.isEmailDomainAllowed(email);
      
      res.json({
        success: true,
        data: { isAllowed },
      });
    } catch (error) {
      logger.error('Error checking domain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check domain',
      });
    }
  }
}

export const domainManagementController = new DomainManagementController();

