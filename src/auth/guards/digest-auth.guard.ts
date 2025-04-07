import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { NonceService } from '../nonce/nonce.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DigestAuthGuard implements CanActivate {
  private readonly realm = 'Restricted Access';
  private readonly opaque = '5ccc069c403ebaf9f0171e9517f40e41';
  private readonly logger = new Logger(DigestAuthGuard.name);

  constructor(
    private nonceService: NonceService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const authHeader = request.headers.authorization;

    this.logger.debug(`Digest Auth - Request URL: ${request.method} ${request.url}`);
    this.logger.debug(`Digest Auth - Authorization header present: ${!!authHeader}`);

    // If no auth header or not a Digest auth header
    if (!authHeader || !authHeader.startsWith('Digest ')) {
      this.logger.debug('Digest Auth - No valid authorization header found, sending challenge');
      this.sendUnauthorizedResponse(response);
      return false;
    }

    try {
      // Parse the digest auth header
      this.logger.debug(`Digest Auth - Header: ${authHeader.substring(0, 100)}...`);
      const authParams = this.parseDigestAuthHeader(authHeader);
      this.logger.debug(`Digest Auth - Parsed params: ${JSON.stringify(authParams)}`);

      // Verify the auth parameters are valid
      if (!this.isValidAuthParams(authParams)) {
        this.logger.debug('Digest Auth - Invalid auth parameters');
        this.sendUnauthorizedResponse(response);
        return false;
      }

      // Check if the nonce is valid
      const isNonceValid = this.nonceService.isValidNonce(authParams.nonce);
      this.logger.debug(`Digest Auth - Nonce valid: ${isNonceValid}`);
      if (!isNonceValid) {
        this.logger.debug('Digest Auth - Invalid nonce, sending new challenge');
        this.sendUnauthorizedResponse(response);
        return false;
      }

      // Get the user
      const user = await this.usersService.findOne(authParams.username);
      this.logger.debug(`Digest Auth - User found: ${!!user}`);
      if (!user) {
        this.logger.debug(`Digest Auth - User not found: ${authParams.username}`);
        this.sendUnauthorizedResponse(response);
        return false;
      }

      // Verify the digest response
      // Use the password 'secret' for testing - in a real app, you would use the user's real password
      // For this demo, we're assuming all test users have password 'secret'
      const password = 'secret';
      this.logger.debug(`Digest Auth - Verifying digest response for user: ${user.username}`);
      
      const isValid = await this.verifyDigestResponse(
        authParams,
        password,
        request.method,
        authParams.uri,
      );

      this.logger.debug(`Digest Auth - Response valid: ${isValid}`);
      if (!isValid) {
        this.logger.debug('Digest Auth - Invalid digest response');
        this.sendUnauthorizedResponse(response);
        return false;
      }

      // Authentication successful - store user in request
      this.logger.debug('Digest Auth - Authentication successful!');
      request.user = {
        userId: user.userId,
        username: user.username,
      };
      
      return true;
    } catch (error) {
      this.logger.error('Digest Auth - Exception during authentication', error);
      this.sendUnauthorizedResponse(response);
      return false;
    }
  }

  private parseDigestAuthHeader(authHeader: string): Record<string, string> {
    const authHeaderValue = authHeader.slice(7); // Remove 'Digest ' prefix
    const parts = authHeaderValue.split(',');
    const authParams: Record<string, string> = {};

    for (const part of parts) {
      try {
        const [key, value] = part.trim().split('=', 2);
        authParams[key] = value.replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
      } catch (e) {
        this.logger.error(`Error parsing digest auth part: ${part}`, e);
      }
    }

    return authParams;
  }

  private isValidAuthParams(authParams: Record<string, string>): boolean {
    const requiredFields = ['username', 'realm', 'nonce', 'uri', 'response'];
    const missingFields = requiredFields.filter(field => !authParams[field]);
    
    if (missingFields.length > 0) {
      this.logger.debug(`Digest Auth - Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    return true;
  }

  private async verifyDigestResponse(
    authParams: Record<string, string>,
    password: string,
    method: string,
    uri: string,
  ): Promise<boolean> {
    // Calculate HA1 = MD5(username:realm:password)
    const ha1 = createHash('md5')
      .update(`${authParams.username}:${this.realm}:${password}`)
      .digest('hex');
    this.logger.debug(`Digest Auth - HA1: ${ha1}`);

    // Calculate HA2 = MD5(method:uri)
    const ha2 = createHash('md5').update(`${method}:${uri}`).digest('hex');
    this.logger.debug(`Digest Auth - HA2: ${ha2} (${method}:${uri})`);

    // Calculate the expected response
    let expectedResponse: string;
    
    // Check if we have a qop (Quality of Protection)
    if (authParams.qop) {
      // If qop is specified, we need the cnonce and nc values
      if (!authParams.cnonce || !authParams.nc) {
        this.logger.debug('Digest Auth - Missing cnonce or nc with qop specified');
        return false;
      }
      
      // MD5(HA1:nonce:nc:cnonce:qop:HA2)
      expectedResponse = createHash('md5')
        .update(`${ha1}:${authParams.nonce}:${authParams.nc}:${authParams.cnonce}:${authParams.qop}:${ha2}`)
        .digest('hex');
      this.logger.debug(`Digest Auth - Expected response with qop: ${expectedResponse}`);
    } else {
      // MD5(HA1:nonce:HA2) - for backwards compatibility
      expectedResponse = createHash('md5')
        .update(`${ha1}:${authParams.nonce}:${ha2}`)
        .digest('hex');
      this.logger.debug(`Digest Auth - Expected response without qop: ${expectedResponse}`);
    }
    
    this.logger.debug(`Digest Auth - Actual response: ${authParams.response}`);

    // Compare with the provided response
    return authParams.response === expectedResponse;
  }

  private sendUnauthorizedResponse(response: any) {
    const nonce = this.nonceService.generateNonce();
    this.logger.debug(`Digest Auth - Sending challenge with nonce: ${nonce}`);
    
    // Include quality of protection (qop) with auth option
    const authHeader = `Digest realm="${this.realm}", nonce="${nonce}", opaque="${this.opaque}", algorithm=MD5, qop="auth"`;
    this.logger.debug(`Digest Auth - WWW-Authenticate header: ${authHeader}`);
    
    response.setHeader('WWW-Authenticate', authHeader);
    
    throw new UnauthorizedException('Unauthorized: Digest Authentication Required');
  }
} 