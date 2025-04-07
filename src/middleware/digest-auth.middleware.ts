import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { NonceService } from '../auth/nonce/nonce.service';
import { UsersService } from '../auth/users/users.service';

@Injectable()
export class DigestAuthMiddleware implements NestMiddleware {
  private readonly realm = 'Restricted Access';
  private readonly opaque = '5ccc069c403ebaf9f0171e9517f40e41';

  constructor(
    private nonceService: NonceService,
    private usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // If no auth header or not a Digest auth header
    if (!authHeader || !authHeader.startsWith('Digest ')) {
      return this.sendUnauthorizedResponse(res);
    }

    try {
      // Parse the digest auth header
      const authParams = this.parseDigestAuthHeader(authHeader);

      // Verify the auth parameters are valid
      if (!this.isValidAuthParams(authParams)) {
        return this.sendUnauthorizedResponse(res);
      }

      // Check if the nonce is valid
      if (!this.nonceService.isValidNonce(authParams.nonce)) {
        return this.sendUnauthorizedResponse(res);
      }

      // Get the user
      const user = await this.usersService.findOne(authParams.username);
      if (!user) {
        return this.sendUnauthorizedResponse(res);
      }

      // Verify the digest response
      const isValid = await this.verifyDigestResponse(
        authParams,
        'secret', // In a real app, you'd use the actual user password
        req.method,
        authParams.uri,
      );

      if (!isValid) {
        return this.sendUnauthorizedResponse(res);
      }

      // Authentication successful
      req['user'] = {
        userId: user.userId,
        username: user.username,
      };
      next();
    } catch (error) {
      return this.sendUnauthorizedResponse(res);
    }
  }

  private parseDigestAuthHeader(authHeader: string): Record<string, string> {
    const authHeaderValue = authHeader.slice(7); // Remove 'Digest ' prefix
    const parts = authHeaderValue.split(',');
    const authParams: Record<string, string> = {};

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      authParams[key] = value.replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
    }

    return authParams;
  }

  private isValidAuthParams(authParams: Record<string, string>): boolean {
    return !!(
      authParams.username &&
      authParams.realm &&
      authParams.nonce &&
      authParams.uri &&
      authParams.response
    );
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

    // Calculate HA2 = MD5(method:uri)
    const ha2 = createHash('md5').update(`${method}:${uri}`).digest('hex');

    // Calculate the expected response = MD5(HA1:nonce:HA2)
    const expectedResponse = createHash('md5')
      .update(`${ha1}:${authParams.nonce}:${ha2}`)
      .digest('hex');

    // Compare with the provided response
    return authParams.response === expectedResponse;
  }

  private sendUnauthorizedResponse(res: Response) {
    const nonce = this.nonceService.generateNonce();
    
    res.setHeader(
      'WWW-Authenticate',
      `Digest realm="${this.realm}", nonce="${nonce}", opaque="${this.opaque}", algorithm=MD5, qop="auth"`,
    );
    
    return res.status(401).json({
      statusCode: 401,
      message: 'Unauthorized: Digest Authentication Required',
    });
  }
} 