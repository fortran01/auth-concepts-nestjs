import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that takes complete control of the response
 * Ensures no CORS headers can be added by any other middleware
 */
@Injectable()
export class DirectResponseMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Log request information
    console.log(`[DirectResponseMiddleware] Intercepting request to ${req.method} ${req.path}`);
    console.log(`[DirectResponseMiddleware] Origin header: ${req.headers.origin || 'none'}`);
    
    if (req.method === 'OPTIONS') {
      console.log('[DirectResponseMiddleware] Handling OPTIONS request directly');
      console.log('[DirectResponseMiddleware] 🛑 SENDING RESPONSE WITHOUT ANY CORS HEADERS 🛑');
      
      // End the response immediately with 204 No Content
      // Do not set any CORS headers
      res.writeHead(204);
      res.end();
      return;
    }
    
    if (req.method === 'GET') {
      console.log('[DirectResponseMiddleware] Handling GET request directly');
      console.log('[DirectResponseMiddleware] 🛑 SENDING RESPONSE WITHOUT ANY CORS HEADERS 🛑');
      console.log('[DirectResponseMiddleware] 🔍 THIS WILL FAIL IN BROWSERS DUE TO SAME-ORIGIN POLICY 🔍');
      
      // Creating the same response as the controller would
      const data = {
        message: 'This is data from the API server',
        status: 'success',
        data: [1, 2, 3, 4, 5]
      };
      
      // Send JSON response without setting any CORS headers
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(data));
      return;
    }
    
    // For any other request types, let the regular flow handle it
    next();
  }
} 