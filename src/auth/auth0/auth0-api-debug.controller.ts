import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('auth0-api-debug')
export class Auth0ApiDebugController {
  private readonly logger = new Logger(Auth0ApiDebugController.name);
  
  constructor(private configService: ConfigService) {}

  @Get()
  async debugAuth0Config() {
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const clientId = this.configService.get<string>('AUTH0_M2M_CLIENT_ID');
    // Mask the secret for security
    const clientSecret = this.configService.get<string>('AUTH0_M2M_CLIENT_SECRET');
    const maskedSecret = clientSecret ? 
      `${clientSecret.substring(0, 4)}...${clientSecret.substring(clientSecret.length - 4)}` : 
      'not set';
    const audience = this.configService.get<string>('AUTH0_API_AUDIENCE');

    // Log the configuration for debugging
    this.logger.log(`Auth0 API Config - Domain: ${domain}, ClientID: ${clientId}, Audience: ${audience}`);
    
    return {
      message: 'Auth0 API Configuration',
      config: {
        domain: domain || 'not set',
        clientId: clientId || 'not set',
        clientSecret: maskedSecret,
        audience: audience || 'not set',
      },
      help: [
        'Check if all values are correctly set',
        'Verify in Auth0 dashboard that the M2M application exists and has permissions to the API',
        'Ensure the audience value matches the identifier of your API in Auth0',
        'Ensure the client ID and secret are for an authorized M2M application'
      ],
      troubleshooting: {
        error_access_denied: 'This usually means the M2M app does not have permission to access the API',
        error_invalid_client: 'This usually means the client ID or secret is incorrect',
        error_invalid_audience: 'This usually means the audience does not match any API in Auth0'
      }
    };
  }
} 