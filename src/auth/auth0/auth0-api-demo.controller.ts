import { Controller, Get, Res, Post, Body, Req, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { Auth0ApiService } from './auth0-api.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth0-api-demo')
export class Auth0ApiDemoController {
  private readonly logger = new Logger(Auth0ApiDemoController.name);
  
  constructor(
    private auth0ApiService: Auth0ApiService,
    private configService: ConfigService,
  ) {}

  @Get()
  async showDemo(@Req() req: Request, @Res() res: Response) {
    // Get the Auth0 domain and audience for the demo page
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const audience = this.configService.get<string>('AUTH0_API_AUDIENCE');
    const clientId = this.configService.get<string>('AUTH0_M2M_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AUTH0_M2M_CLIENT_SECRET');
    
    // Check if configuration is valid
    const isConfigValid = !!(domain && audience && clientId && clientSecret);
    const configWarnings = [];
    
    if (!domain) configWarnings.push('AUTH0_DOMAIN is not set');
    if (!audience) configWarnings.push('AUTH0_API_AUDIENCE is not set');
    if (!clientId) configWarnings.push('AUTH0_M2M_CLIENT_ID is not set');
    if (!clientSecret) configWarnings.push('AUTH0_M2M_CLIENT_SECRET is not set');
    
    if (!isConfigValid) {
      this.logger.warn(`Auth0 API demo loaded with invalid configuration: ${configWarnings.join(', ')}`);
    }
    
    // Render the demo page with Auth0 configuration
    return res.render('auth0-api-demo', {
      title: 'Auth0 API Demo',
      domain: domain || 'not set',
      audience: audience || 'not set',
      apiUrl: `${req.protocol}://${req.get('host')}`,
      isConfigValid,
      configWarnings
    });
  }

  @Post('get-token')
  async getToken() {
    try {
      const domain = this.configService.get<string>('AUTH0_DOMAIN');
      const clientId = this.configService.get<string>('AUTH0_M2M_CLIENT_ID');
      const audience = this.configService.get<string>('AUTH0_API_AUDIENCE');
      
      if (!domain || !clientId || !audience) {
        this.logger.error('Attempting to get token with missing configuration');
        return {
          success: false,
          error: 'Missing Auth0 configuration',
          details: {
            hasDomain: !!domain,
            hasClientId: !!clientId,
            hasAudience: !!audience
          }
        };
      }
      
      // Get M2M token for API access
      this.logger.log('Attempting to get Auth0 M2M token');
      const tokenResponse = await this.auth0ApiService.getM2MToken();
      this.logger.log('Successfully obtained Auth0 M2M token');
      
      return {
        success: true,
        ...tokenResponse,
      };
    } catch (error) {
      this.logger.error(`Error getting token: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
} 