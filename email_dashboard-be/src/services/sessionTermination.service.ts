import logger from '../config/logger';

/**
 * Response interface for session termination API
 */
interface SessionTerminationResponse {
  success: boolean;
  message?: string;
}

/**
 * Service for terminating user sessions via external API
 */
class SessionTerminationService {
  /**
   * Terminate a user's session by calling the external API
   * @param {string} email - User's email address
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async terminateSession(email: string): Promise<boolean> {
    logger.info('[SESSION-TERMINATION] ========== Terminate Session ==========');
    logger.info(`[SESSION-TERMINATION] Email: ${email}`);
    
    const stopThreadUrl = process.env.STOP_THREAD_URL;
    logger.info(`[SESSION-TERMINATION] STOP_THREAD_URL configured: ${!!stopThreadUrl}`);

    if (!stopThreadUrl) {
      logger.warn('[SESSION-TERMINATION] STOP_THREAD_URL not configured, skipping session termination');
      return false;
    }

    try {
      // Ensure URL doesn't have trailing slash
      const baseUrl = stopThreadUrl.replace(/\/$/, '');
      const terminateUrl = `${baseUrl}/api/session/terminate`;

      logger.info(`[SESSION-TERMINATION] Calling external API: ${terminateUrl}`);
      logger.info(`[SESSION-TERMINATION] Request body:`, { email });

      // Use https module directly for HTTPS requests
      const startTime = Date.now();
      
      const https = await import('https');
      const http = await import('http');
      
      return new Promise<boolean>((resolve) => {
        const urlObj = new URL(terminateUrl);
        const requestOptions: any = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        };

        // For HTTPS, disable certificate verification to handle self-signed certificates
        // This is necessary for internal services that may use self-signed certs
        if (urlObj.protocol === 'https:') {
          requestOptions.rejectUnauthorized = false;
        }

        const client = urlObj.protocol === 'https:' ? https : http;
        const req = client.request(requestOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            const duration = Date.now() - startTime;
            logger.info(`[SESSION-TERMINATION] API response received in ${duration}ms`);
            logger.info(`[SESSION-TERMINATION] Response status: ${res.statusCode} ${res.statusMessage}`);
            
            try {
              const result = JSON.parse(data) as SessionTerminationResponse;
              logger.info(`[SESSION-TERMINATION] API response:`, result);
              
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && result.success) {
                logger.info(`[SESSION-TERMINATION] ✓ Session terminated successfully for ${email}`);
                logger.info(`[SESSION-TERMINATION] Message: ${result.message || 'Session terminated'}`);
                logger.info('[SESSION-TERMINATION] ========== Termination Complete ==========');
                resolve(true);
              } else {
                logger.warn(`[SESSION-TERMINATION] ⚠ API returned success=false for ${email}`);
                logger.warn(`[SESSION-TERMINATION] Message: ${result.message || 'Unknown error'}`);
                resolve(false);
              }
            } catch (parseError) {
              logger.error(`[SESSION-TERMINATION] ❌ Failed to parse response: ${data}`);
              logger.error(`[SESSION-TERMINATION] Parse error:`, parseError);
              resolve(false);
            }
          });
        });

        req.on('error', (error) => {
          logger.error('[SESSION-TERMINATION] Request error:', error);
          resolve(false);
        });

        req.write(JSON.stringify({ email }));
        req.end();
      });
    } catch (error) {
      // Log error but don't fail user deletion if session termination fails
      logger.error('[SESSION-TERMINATION] ========== Termination Error ==========');
      logger.error(`[SESSION-TERMINATION] Email: ${email}`);
      logger.error('[SESSION-TERMINATION] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[SESSION-TERMINATION] Error message: ${error.message}`);
        logger.error(`[SESSION-TERMINATION] Error name: ${error.name}`);
        
        // Log the cause if available (for SSL errors, etc.)
        if ('cause' in error && error.cause) {
          logger.error(`[SESSION-TERMINATION] Error cause:`, error.cause);
          if (typeof error.cause === 'object' && error.cause !== null && 'code' in error.cause) {
            logger.error(`[SESSION-TERMINATION] Error code: ${(error.cause as any).code}`);
            
          }
        }
        
        if (error.stack) {
          logger.error(`[SESSION-TERMINATION] Error stack: ${error.stack}`);
        }
      }
      logger.error('[SESSION-TERMINATION] ⚠ Session termination failed, but user deletion will continue');
      return false;
    }
  }
}

// Export singleton instance
export const sessionTerminationService = new SessionTerminationService();
export default sessionTerminationService;

