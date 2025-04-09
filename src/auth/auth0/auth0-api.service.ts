import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class Auth0ApiService {
  private readonly logger = new Logger(Auth0ApiService.name);
  
  constructor(private configService: ConfigService) {}

  /**
   * Gets a Machine-to-Machine token for API access
   */
  async getM2MToken(): Promise<TokenResponse> {
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const clientId = this.configService.get<string>('AUTH0_M2M_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AUTH0_M2M_CLIENT_SECRET');
    const audience = this.configService.get<string>('AUTH0_API_AUDIENCE');

    this.logger.log(`Attempting to get M2M token from Auth0 (${domain}) with audience: ${audience}`);
    
    // Check if all required values are present
    if (!domain || !clientId || !clientSecret || !audience) {
      this.logger.error('Missing required Auth0 configuration values');
      this.logger.debug(`Domain: ${!!domain}, ClientId: ${!!clientId}, Secret: ${!!clientSecret}, Audience: ${!!audience}`);
      throw new Error('Missing required Auth0 configuration. Check environment variables.');
    }

    try {
      const tokenUrl = `https://${domain}/oauth/token`;
      this.logger.debug(`Requesting token from: ${tokenUrl}`);
      
      const payload = {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: audience,
      };
      
      this.logger.debug(`Using client ID: ${clientId.substring(0, 6)}...`);
      this.logger.debug(`Using audience: ${audience}`);
      
      this.logger.log('Sending request to Auth0...');
      
      const response = await axios.post(
        tokenUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('Successfully obtained token from Auth0');
      
      // Log success details (safely)
      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        this.logger.debug(`Received token: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
        this.logger.debug(`Token expires in: ${response.data.expires_in} seconds`);
      }
      
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { error: error.message };
      this.logger.error('Error getting M2M token from Auth0:', errorData);
      
      // Log more detailed info about the error
      if (error.response) {
        this.logger.debug(`Status code: ${error.response.status}`);
        this.logger.debug(`Response headers:`, error.response.headers);
        this.logger.debug(`Response data:`, error.response.data);
      } else if (error.request) {
        this.logger.debug('No response received from Auth0');
      } else {
        this.logger.debug('Error setting up request:', error.message);
      }
      
      // Construct a more helpful error message based on the error type
      let errorMessage = 'Failed to get M2M token from Auth0';
      
      if (error.response?.data) {
        const { error: errorCode, error_description } = error.response.data;
        
        if (errorCode === 'access_denied' && error_description === 'Unauthorized') {
          errorMessage = 'Unauthorized: Check if M2M client ID and secret are correct and have permission to access the API';
          this.logger.debug('Auth0 API Configuration Guide:');
          this.logger.debug('1. In Auth0 Dashboard, go to Applications > APIs and check if your API exists');
          this.logger.debug(`2. Verify API identifier matches your audience: ${audience}`);
          this.logger.debug('3. Go to Applications > Applications and check M2M application');
          this.logger.debug(`4. Verify client ID matches: ${clientId}`);
          this.logger.debug('5. In the M2M application, verify API permissions are granted');
        } else if (errorCode === 'invalid_client') {
          errorMessage = 'Invalid client: The M2M client ID or secret is incorrect';
        } else if (errorCode) {
          errorMessage = `Auth0 error: ${errorCode} - ${error_description || ''}`;
        }
      }
      
      this.logger.debug('For Auth0 configuration debugging, visit: /auth0-api-debug');
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Validates a token has the required scopes
   */
  hasRequiredScopes(scopesString: string, requiredScopes: string[]): boolean {
    if (!scopesString) {
      return false;
    }

    const tokenScopes = scopesString.split(' ');
    return requiredScopes.every(scope => tokenScopes.includes(scope));
  }
} 