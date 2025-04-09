import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class Auth0Guard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check if user is authenticated with Auth0
    const isAuthenticated = !!request.session['auth0User'];
    
    return isAuthenticated;
  }
} 