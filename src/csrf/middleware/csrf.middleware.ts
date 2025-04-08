import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CsrfService } from '../csrf.service';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly csrfService: CsrfService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF validation for non-mutating methods and for specific paths if needed
    if (
      req.method === 'GET' || 
      req.method === 'HEAD' || 
      req.method === 'OPTIONS' || 
      req.path.startsWith('/api/') // Skip for API endpoints that might be using other auth methods
    ) {
      return next();
    }

    const token = req.body.csrf_token;
    
    if (!token || !this.csrfService.validateToken(req, token)) {
      // For demo purposes, we'll redirect instead of throwing an error
      // This makes the demo friendlier for users
      if (req.path === '/csrf-demo/update-username-protected') {
        // Flash message will be handled by the controller
        return res.redirect('/csrf-demo/profile-protected');
      }
      
      throw new UnauthorizedException(
        'Invalid CSRF token. This could be a cross-site request forgery attempt!'
      );
    }

    next();
  }
}
