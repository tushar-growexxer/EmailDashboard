import { getLdapConfig } from '../config/ldap';
import logger from '../config/logger';
import ldap from 'ldapjs';

export interface LdapUser {
  username: string;
  authenticated: boolean;
  userDN: string;
  displayName?: string;
  email?: string;
  upn?: string;
}

/**
 * LDAP Service for authentication
 */
export class LdapService {
  private config = getLdapConfig();

  /**
   * Authenticate user against LDAP server
   * @param username - Username to authenticate
   * @param password - Password to authenticate with
   * @returns Promise<LdapUser> Authentication result
   */
  async authenticateUser(username: string, password: string): Promise<LdapUser> {
    let client: ldap.Client | null = null;

    try {
      // Create LDAP client (simplified like the working test script)
      client = ldap.createClient({
        url: this.config.url,
        timeout: this.config.timeout,
        connectTimeout: this.config.connectTimeout,
        // Remove TLS options initially to match working test
      });

      logger.info(`Attempting LDAP authentication for user: ${username}`);
      logger.info(`LDAP Config - URL: ${this.config.url}, BaseDN: ${this.config.baseDN}, UserDN: ${this.config.userDN}`);

      // Test basic connectivity first
      await new Promise((resolve, reject) => {
        const testClient = ldap.createClient({
          url: this.config.url,
          timeout: 5000,
          connectTimeout: 5000,
          // No TLS options to match working test script
        });

        testClient.on('connect', () => {
          logger.info('✅ LDAP server connection successful');
          testClient.unbind();
          resolve(void 0);
        });

        testClient.on('error', (err) => {
          logger.error('❌ LDAP server connection failed:', err);
          testClient.unbind();
          reject(err);
        });

        setTimeout(() => {
          logger.warn('⏱️ LDAP connection timeout');
          testClient.unbind();
          reject(new Error('Connection timeout'));
        }, 6000);
      });

      // APPROACH 1: Try direct UPN authentication first (since we know this works from your test)
      logger.info(`Trying direct UPN authentication: ${username}`);
      try {
        await this.bindWithCredentials(client, username, password);

        // If bind successful, get user details
        const userDetails = await this.searchUserDetails(client, username);

        logger.info(`LDAP authentication successful via direct UPN for user: ${username}`);
        return {
          username,
          authenticated: true,
          userDN: username, // The UPN itself is the DN
          displayName: userDetails.displayName,
          email: userDetails.email,
          upn: userDetails.upn,
        };
      } catch (upnError) {
        logger.warn(`Direct UPN authentication failed:`, upnError instanceof Error ? upnError.message : upnError);

        // APPROACH 2: Try searching for user DN and then authenticate
        logger.info(`Trying LDAP search for user DN`);
        const userDN = await this.searchUserDN(client, username);

        if (userDN) {
          logger.info(`Found user DN: ${userDN}`);

          // Now authenticate with the found DN
          await this.bindWithCredentials(client, userDN, password);

          // If bind successful, get user details
          const userDetails = await this.searchUserDetails(client, userDN);

          logger.info(`LDAP authentication successful for user: ${username} using DN: ${userDN}`);

          return {
            username,
            authenticated: true,
            userDN,
            displayName: userDetails.displayName,
            email: userDetails.email,
            upn: userDetails.upn,
          };
        }

        // APPROACH 3: Try common DN patterns as last resort
        logger.info(`Trying fallback DN patterns`);
        const fallbackDNs = this.generateFallbackDNs(username);

        for (const fallbackDN of fallbackDNs) {
          try {
            logger.debug(`Trying fallback DN: ${fallbackDN}`);
            await this.bindWithCredentials(client, fallbackDN, password);

            const userDetails = await this.searchUserDetails(client, fallbackDN);

            logger.info(`LDAP authentication successful via fallback DN: ${fallbackDN}`);
            return {
              username,
              authenticated: true,
              userDN: fallbackDN,
              displayName: userDetails.displayName,
              email: userDetails.email,
              upn: userDetails.upn,
            };
          } catch (fallbackError) {
            logger.debug(`Fallback DN failed: ${fallbackDN}`, fallbackError instanceof Error ? fallbackError.message : fallbackError);
          }
        }

        logger.warn(`All authentication methods failed for user: ${username}`);
        return {
          username,
          authenticated: false,
          userDN: '',
        };
      }

    } catch (error) {
      logger.error('LDAP authentication error:', error);
      return {
        username,
        authenticated: false,
        userDN: '',
      };
    } finally {
      // Always close the client
      if (client) {
        try {
          client.unbind();
        } catch (unbindError) {
          logger.warn('Error unbinding LDAP client:', unbindError);
        }
      }
    }
  }

  /**
   * Search for user's DN in LDAP directory using anonymous bind
   * @param client - LDAP client
   * @param username - Username or email to search for
   * @returns Promise with user DN or null if not found
   */
  private async searchUserDN(client: ldap.Client, username: string): Promise<string | null> {
    return new Promise((resolve) => {
      // Extract username and domain parts
      let userPart: string;
      let domainPart: string;
      let searchEmail: string;

      if (username.includes('@')) {
        [userPart, domainPart] = username.split('@');
        searchEmail = username;
      } else {
        userPart = username;
        domainPart = this.config.defaultDomain || 'matangi.com';
        searchEmail = `${userPart}@${domainPart}`;
      }

      logger.debug(`Searching for user - User: ${userPart}, Domain: ${domainPart}, Email: ${searchEmail}`);

      // Try multiple search bases to find the user
      const searchBases = [
        this.config.baseDN, // dc=matangi,dc=com
        this.config.userDN, // ou=users,dc=matangi,dc=com
        `ou=users,${this.config.baseDN}`, // ou=users,dc=matangi,dc=com
        `cn=users,${this.config.baseDN}`, // cn=users,dc=matangi,dc=com
        `ou=people,${this.config.baseDN}`, // ou=people,dc=matangi,dc=com
        `cn=users,ou=users,${this.config.baseDN}`, // cn=users,ou=users,dc=matangi,dc=com
      ];

      // Search filter - try multiple attributes
      const searchFilter = `(|(mail=${searchEmail})(userPrincipalName=${searchEmail})(sAMAccountName=${userPart})(cn=${userPart})(cn=${searchEmail})(uid=${userPart})(uid=${searchEmail}))`;

      logger.info(`LDAP search filter: ${searchFilter}`);
      logger.info(`Trying search bases:`, searchBases);

      let foundDN: string | null = null;
      let searchCount = 0;

      const tryNextBase = () => {
        if (searchCount >= searchBases.length) {
          logger.warn(`User not found in any search base. Last filter: ${searchFilter}`);
          resolve(null);
          return;
        }

        const currentBase = searchBases[searchCount];
        logger.debug(`Searching in base: ${currentBase}`);

        const searchOptions = {
          scope: 'sub' as const,
          filter: searchFilter,
          attributes: ['dn', 'cn', 'mail', 'userPrincipalName', 'sAMAccountName', 'displayName'],
          sizeLimit: 5, // Get a few results to see what's available
        };

        client.search(currentBase, searchOptions, (err, res) => {
          if (err) {
            logger.warn(`Search failed in base ${currentBase}:`, err.message || err);
            searchCount++;
            tryNextBase();
            return;
          }

          let resultCount = 0;

          res.on('searchEntry', (entry) => {
            resultCount++;
            const userDN = entry.dn.toString();
            logger.info(`Found user ${resultCount}: ${userDN}`);

            // Log all attributes for debugging
            if (entry.attributes && entry.attributes.length > 0) {
              logger.debug(`User attributes:`, entry.attributes.map((attr: any) => ({
                type: attr.type,
                values: attr.values
              })));
            }

            // If this looks like our user, use it
            if (userDN.toLowerCase().includes(userPart.toLowerCase()) ||
                entry.attributes?.some((attr: any) =>
                  (attr.type === 'mail' || attr.type === 'userPrincipalName') &&
                  attr.values?.some((value: string) => value.toLowerCase().includes(searchEmail.toLowerCase()))
                )) {
              foundDN = userDN;
              logger.info(`Selected user DN: ${foundDN}`);
            }
          });

          res.on('error', (error) => {
            logger.warn(`Search error in base ${currentBase}:`, error.message || error);
            searchCount++;
            tryNextBase();
          });

          res.on('end', () => {
            logger.debug(`Search completed in base ${currentBase}. Found ${resultCount} results.`);
            searchCount++;

            if (foundDN) {
              logger.info(`Successfully found user DN: ${foundDN}`);
              resolve(foundDN);
            } else {
              tryNextBase();
            }
          });
        });
      };

      tryNextBase();
    });
  }

  /**
   * Generate fallback DN patterns as last resort
   * @param username - Username to generate DNs for
   * @returns Array of fallback DN patterns
   */
  private generateFallbackDNs(username: string): string[] {
    const dns: string[] = [];

    // Extract username and domain parts
    let userPart: string;
    let domainPart: string;
    let fullEmail: string;

    if (username.includes('@')) {
      [userPart, domainPart] = username.split('@');
      fullEmail = username;
    } else {
      userPart = username;
      domainPart = this.config.defaultDomain || 'matangi.com';
      fullEmail = `${userPart}@${domainPart}`;
    }

    // Get the domain DN - convert domain.com to dc=domain,dc=com
    const domainDN = this.getDomainDN(domainPart);

    // Most common fallback patterns based on typical LDAP structures
    dns.push(`cn=${userPart},${this.config.userDN}`);
    dns.push(`uid=${userPart},${this.config.userDN}`);
    dns.push(`sAMAccountName=${userPart},${this.config.userDN}`);
    dns.push(`mail=${fullEmail},${this.config.userDN}`);
    dns.push(`userPrincipalName=${fullEmail},${this.config.userDN}`);

    // Try alternative user containers
    dns.push(`cn=${userPart},ou=users,${domainDN}`);
    dns.push(`cn=${userPart},cn=users,${domainDN}`);
    dns.push(`cn=${userPart},ou=people,${domainDN}`);

    // Try with full email as CN
    dns.push(`cn=${fullEmail},${this.config.userDN}`);

    logger.debug(`Generated ${dns.length} fallback DN patterns:`, dns);
    return dns;
  }

  /**
   * Convert domain name to LDAP DN format
   * @param domain - Domain name (e.g., matangi.com)
   * @returns LDAP DN format (e.g., dc=matangi,dc=com)
   */
  private getDomainDN(domain: string): string {
    return domain
      .split('.')
      .map(part => `dc=${part}`)
      .join(',');
  }

  /**
   * Bind to LDAP server with user credentials
   * @param client - LDAP client
   * @param userDN - User DN to bind with
   * @param password - User password
   * @returns Promise that resolves on successful bind
   */
  private bindWithCredentials(client: ldap.Client, userDN: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      client.bind(userDN, password, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Search for user details after successful authentication
   * @param client - LDAP client
   * @param userDN - User DN that was successfully authenticated
   * @returns Promise with user details
   */
  private async searchUserDetails(client: ldap.Client, userDN: string): Promise<{
    displayName?: string;
    email?: string;
    upn?: string;
  }> {
    return new Promise((resolve) => {
      const searchOptions = {
        scope: 'base' as const,
        attributes: ['displayName', 'mail', 'userPrincipalName', 'cn'],
      };

      client.search(userDN, searchOptions, (err: Error | null, res: any) => {
        if (err) {
          logger.warn('LDAP user details search failed:', err);
          resolve({});
          return;
        }

        let userDetails: any = {};

        res.on('searchEntry', (entry: any) => {
          const attributes = entry.attributes;
          attributes.forEach((attr: any) => {
            if (attr.type === 'displayName' && attr.values?.length > 0) {
              userDetails.displayName = attr.values[0];
            }
            if (attr.type === 'mail' && attr.values?.length > 0) {
              userDetails.email = attr.values[0];
            }
            if (attr.type === 'userPrincipalName' && attr.values?.length > 0) {
              userDetails.upn = attr.values[0];
            }
          });
        });

        res.on('error', () => {
          logger.warn('LDAP search error occurred');
          resolve({});
        });

        res.on('end', () => {
          resolve(userDetails);
        });
      });
    });
  }

  /**
   * Test LDAP connection
   * @returns Promise<boolean> Connection test result
   */
  async testConnection(): Promise<boolean> {
    let client: ldap.Client | null = null;

    try {
      client = ldap.createClient({
        url: this.config.url,
        timeout: this.config.timeout,
        connectTimeout: this.config.connectTimeout,
        // Simplified config like the working test script
      });

      // Try to bind with bind DN if provided, otherwise try anonymous bind
      if (this.config.bindDN && this.config.bindPassword) {
        await this.bindWithCredentials(client, this.config.bindDN, this.config.bindPassword);
      } else {
        await this.bindWithCredentials(client, '', '');
      }

      logger.info('LDAP connection test successful');
      return true;

    } catch (error) {
      logger.error('LDAP connection test failed:', error);
      return false;
    } finally {
      if (client) {
        try {
          client.unbind();
        } catch (unbindError) {
          logger.warn('Error unbinding LDAP client during test:', unbindError);
        }
      }
    }
  }
}

// Export singleton instance
export const ldapService = new LdapService();
