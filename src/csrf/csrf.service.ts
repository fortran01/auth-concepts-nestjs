import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Request } from 'express';

@Injectable()
export class CsrfService {
  /**
   * Generate a CSRF token and store it in the session
   * 
   * @param req - The Express request object with session
   * @returns The generated CSRF token
   */
  generateToken(req: Request): string {
    if (!req.session['csrf_token']) {
      // Generate a random hex token
      req.session['csrf_token'] = randomBytes(32).toString('hex');
    }
    return req.session['csrf_token'];
  }

  /**
   * Validate a CSRF token against the one stored in the session
   * 
   * @param req - The Express request object with session
   * @param token - The token to validate
   * @returns Whether the token is valid
   */
  validateToken(req: Request, token: string): boolean {
    const storedToken = req.session['csrf_token'];
    return !!storedToken && storedToken === token;
  }
}
