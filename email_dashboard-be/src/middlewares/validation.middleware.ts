import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for request body validation
 */
export class ValidationMiddleware {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if email is valid, false otherwise
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {boolean} True if password meets requirements, false otherwise
   */
  static isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Validate role
   * @param {string} role - Role to validate
   * @returns {boolean} True if role is valid, false otherwise
   */
  static isValidRole(role: string): boolean {
    return ['admin', 'user'].includes(role);
  }

  /**
   * Middleware to validate login request
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  static validateLogin(req: Request, res: Response, next: NextFunction): void {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    if (!this.isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
      return;
    }

    next();
  }

  /**
   * Middleware to validate create user request
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  static validateCreateUser(req: Request, res: Response, next: NextFunction): void {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({
        success: false,
        message: 'All fields (fullName, email, password, role) are required',
      });
      return;
    }

    if (!this.isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
      return;
    }

    if (!this.isValidPassword(password)) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    if (!this.isValidRole(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "admin" or "user"',
      });
      return;
    }

    next();
  }

  /**
   * Middleware to validate update user request
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  static validateUpdateUser(req: Request, res: Response, next: NextFunction): void {
    const { fullName, role } = req.body;

    if (!fullName && !role) {
      res.status(400).json({
        success: false,
        message: 'At least one field (fullName or role) must be provided',
      });
      return;
    }

    if (role && !this.isValidRole(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "admin" or "user"',
      });
      return;
    }

    next();
  }

  /**
   * Middleware to validate user ID parameter
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  static validateUserId(req: Request, res: Response, next: NextFunction): void {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
      return;
    }

    req.params.id = userId.toString(); // Ensure it's a valid number
    next();
  }
}

export default ValidationMiddleware;
