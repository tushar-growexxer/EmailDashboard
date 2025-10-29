/**
 * LDAP Configuration
 * Environment variables for LDAP authentication
 */
export interface LdapConfig {
  url: string;
  baseDN: string;
  userDN: string;
  bindDN?: string;
  bindPassword?: string;
  timeout: number;
  connectTimeout: number;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
  defaultDomain?: string;
}

/**
 * Get LDAP configuration from environment variables
 * @returns {LdapConfig} LDAP configuration object
 */
export function getLdapConfig(): LdapConfig {
  return {
    url: process.env.LDAP_URL || 'ldap://192.168.10.2:389',
    baseDN: process.env.LDAP_BASE_DN || 'dc=matangi,dc=com',
    userDN: process.env.LDAP_USER_DN || 'ou=users,dc=matangi,dc=com',
    bindDN: process.env.LDAP_BIND_DN || undefined,
    bindPassword: process.env.LDAP_BIND_PASSWORD || undefined,
    timeout: parseInt(process.env.LDAP_TIMEOUT || '10000', 10),
    connectTimeout: parseInt(process.env.LDAP_CONNECT_TIMEOUT || '15000', 10),
    tlsOptions: {
      rejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
    defaultDomain: process.env.LDAP_DEFAULT_DOMAIN || 'matangi.com',
  };
}
