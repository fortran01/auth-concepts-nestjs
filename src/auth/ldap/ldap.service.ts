import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ldap from 'ldapjs';

export interface LdapUser {
  dn: string;
  uid: string;
  cn: string;
  sn: string;
  givenName: string;
  mail: string;
  title?: string;
  [key: string]: any;
}

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);
  private readonly ldapConfig: {
    url: string;
    baseDN: string;
    adminDN: string;
    adminPassword: string;
  };

  constructor(private configService: ConfigService) {
    this.ldapConfig = {
      url: this.configService.get<string>('LDAP_URL') || 'ldap://localhost:10489',
      baseDN: this.configService.get<string>('LDAP_BASE_DN') || 'dc=example,dc=org',
      adminDN: this.configService.get<string>('LDAP_ADMIN_DN') || 'cn=admin,dc=example,dc=org',
      adminPassword: this.configService.get<string>('LDAP_ADMIN_PASSWORD') || 'admin_password',
    };
  }

  private createClient(): ldap.Client {
    this.logger.debug(`Creating LDAP client with URL: ${this.ldapConfig.url}`);
    return ldap.createClient({
      url: this.ldapConfig.url,
      timeout: 5000,
      connectTimeout: 10000,
    });
  }

  /**
   * Authenticate a user with LDAP
   * @param username The username (uid) to authenticate
   * @param password The password to authenticate with
   * @returns User information if authentication is successful, null otherwise
   */
  async authenticate(username: string, password: string): Promise<LdapUser | null> {
    const client = this.createClient();
    
    try {
      // Construct the user DN
      const userDN = `uid=${username},ou=People,${this.ldapConfig.baseDN}`;
      this.logger.debug(`Attempting to authenticate user with DN: ${userDN}`);

      // First bind to verify the credentials
      await this.bindUser(client, userDN, password);
      
      // If the bind is successful, get the user details
      this.logger.debug(`User ${username} authenticated successfully, retrieving details`);
      return await this.getUserDetails(username);
    } catch (error) {
      this.logger.error(`LDAP authentication failed for user ${username}`, error);
      return null;
    } finally {
      // Always unbind and destroy the client to clean up
      this.destroyClient(client);
    }
  }

  /**
   * Get details for a user from LDAP
   * @param username The username (uid) to get details for
   * @returns User information
   */
  async getUserDetails(username: string): Promise<LdapUser | null> {
    const client = this.createClient();
    
    try {
      // Bind with admin credentials
      await this.bindUser(client, this.ldapConfig.adminDN, this.ldapConfig.adminPassword);
      
      // Create search options
      const searchOptions: ldap.SearchOptions = {
        scope: 'sub' as const,
        filter: `(uid=${username})`,
        attributes: ['dn', 'uid', 'cn', 'sn', 'givenName', 'mail', 'title'],
      };

      this.logger.debug(`Searching for user: ${username} with filter: (uid=${username})`);
      this.logger.debug(`Search base: ou=People,${this.ldapConfig.baseDN}`);
      
      // Perform the search
      const result = await this.searchLDAP(client, `ou=People,${this.ldapConfig.baseDN}`, searchOptions);
      
      if (result && result.length > 0) {
        const user = result[0];
        this.logger.debug(`Raw user data from LDAP: ${JSON.stringify(user, null, 2)}`);
        
        // Format the user object with explicit property access
        // Handle both string and array attribute values (LDAP can return either)
        const formatAttr = (attr: any, propName: string): string => {
          this.logger.debug(`Formatting attribute '${propName}': ${JSON.stringify(attr)}`);
          
          if (attr === undefined || attr === null) {
            this.logger.warn(`Attribute '${propName}' is undefined or null`);
            return '';
          }
          
          if (typeof attr === 'string') {
            return attr;
          }
          
          if (Array.isArray(attr)) {
            if (attr.length === 0) {
              this.logger.warn(`Attribute '${propName}' is an empty array`);
              return '';
            }
            
            const value = attr[0];
            if (value === null || value === undefined) {
              this.logger.warn(`First value of attribute '${propName}' array is null or undefined`);
              return '';
            }
            
            return String(value);
          }
          
          // Last resort, try to convert to string
          this.logger.debug(`Converting attribute '${propName}' type ${typeof attr} to string`);
          return String(attr);
        };
        
        const userObj: LdapUser = {
          dn: user.dn || '',
          uid: formatAttr(user.uid, 'uid'),
          cn: formatAttr(user.cn, 'cn'),
          sn: formatAttr(user.sn, 'sn'),
          givenName: formatAttr(user.givenName, 'givenName'),
          mail: formatAttr(user.mail, 'mail'),
          title: formatAttr(user.title, 'title'),
        };
        
        this.logger.debug(`Formatted user object: ${JSON.stringify(userObj, null, 2)}`);
        return userObj;
      } else {
        this.logger.warn(`No user found with username: ${username}`);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to retrieve user details for ${username}`, error);
      return null;
    } finally {
      // Always unbind and destroy the client to clean up
      this.destroyClient(client);
    }
  }

  /**
   * Bind to the LDAP server with the specified DN and password
   */
  private async bindUser(client: ldap.Client, dn: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Debug the bind attempt - mask password in logs
      this.logger.debug(`Attempting to bind with DN: ${dn} and password: ******`);
      
      client.bind(dn, password, (err) => {
        if (err) {
          const errorCode = String(err.code);
          
          if (errorCode === 'ETIMEDOUT') {
            this.logger.error(`LDAP connection timed out: ${err.message}`);
            reject(new Error(`LDAP connection timed out: ${err.message}`));
          } else if (errorCode === '49') {
            this.logger.debug(`LDAP bind failed for ${dn}: Invalid credentials`);
            reject(new Error('Invalid credentials'));
          } else if (errorCode === 'ECONNREFUSED') {
            this.logger.error(`LDAP connection refused: ${err.message}`);
            reject(new Error(`LDAP connection refused: ${err.message}`));
          } else {
            this.logger.debug(`LDAP bind failed for ${dn}: ${errorCode} - ${err.message}`);
            reject(err);
          }
        } else {
          this.logger.debug(`LDAP bind successful for ${dn}`);
          resolve();
        }
      });
    });
  }

  /**
   * Search the LDAP directory
   */
  private async searchLDAP(client: ldap.Client, base: string, options: ldap.SearchOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      this.logger.debug(`Performing LDAP search on base: ${base} with filter: ${options.filter}`);
      
      client.search(base, options, (err, res) => {
        if (err) {
          this.logger.error(`LDAP search error: ${err.message}`, err);
          reject(err);
          return;
        }
        
        res.on('searchEntry', (entry) => {
          // Use pojo property which is the standard in newer ldapjs versions
          this.logger.debug(`LDAP search entry received`);
          
          try {
            // Try to access pojo (the standard way)
            if (entry.pojo) {
              this.logger.debug(`Using entry.pojo: ${JSON.stringify(entry.pojo)}`);
              results.push(entry.pojo);
            } 
            // Fallback for older versions or different entry formats
            else {
              this.logger.debug(`entry.pojo not found, trying alternative ways to extract entry data`);
              // Try to extract as a generic object with any property
              const anyEntry = entry as any;
              
              if (anyEntry.object) {
                this.logger.debug(`Using entry.object fallback`);
                results.push(anyEntry.object);
              } else {
                // Last resort - build a custom object from attributes
                this.logger.debug(`Using attributes fallback`);
                const entryObj: any = { dn: anyEntry.dn || anyEntry.objectName || '' };
                
                // Try to extract attributes if they exist
                if (anyEntry.attributes) {
                  anyEntry.attributes.forEach((attr: any) => {
                    if (attr.type) {
                      entryObj[attr.type] = attr.vals && attr.vals.length ? 
                        (attr.vals.length === 1 ? attr.vals[0] : attr.vals) : '';
                    }
                  });
                }
                
                results.push(entryObj);
              }
            }
          } catch (error) {
            this.logger.error(`Error processing search entry: ${error.message}`, error);
            // Don't fail the whole search due to one entry processing error
          }
        });
        
        res.on('error', (err) => {
          this.logger.error(`LDAP search result error: ${err.message}`, err);
          reject(err);
        });
        
        res.on('end', (result) => {
          this.logger.debug(`LDAP search completed. Found ${results.length} results`);
          if (results.length === 0) {
            this.logger.debug(`No search results found for base: ${base}, filter: ${options.filter}`);
          }
          resolve(results);
        });
      });
    });
  }

  /**
   * Unbind and destroy the LDAP client
   */
  private destroyClient(client: ldap.Client): void {
    try {
      client.unbind((err) => {
        if (err) {
          this.logger.warn('Error during LDAP unbind operation', err);
        }
        client.destroy();
      });
    } catch (error) {
      this.logger.warn('Error destroying LDAP client', error);
      // Still try to destroy the client
      client.destroy();
    }
  }

  /**
   * Test the LDAP connection using admin credentials
   * @returns Object with success status and message
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const client = this.createClient();
    
    try {
      this.logger.debug(`Testing LDAP connection to ${this.ldapConfig.url}`);
      this.logger.debug(`Binding with DN: ${this.ldapConfig.adminDN}`);
      
      // Try to bind with admin credentials
      await this.bindUser(client, this.ldapConfig.adminDN, this.ldapConfig.adminPassword);
      
      // If we get here, the connection was successful
      this.logger.debug('LDAP connection test successful');
      return { 
        success: true, 
        message: 'Successfully connected to LDAP server and bound with admin credentials' 
      };
    } catch (error) {
      this.logger.error('LDAP connection test failed', error);
      return { 
        success: false, 
        message: `Failed to connect to LDAP server: ${error.message}` 
      };
    } finally {
      // Always unbind and destroy the client to clean up
      this.destroyClient(client);
    }
  }
} 