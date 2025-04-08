import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that removes any CORS headers from specific routes
 * Used to demonstrate browser's Same-Origin Policy blocking
 */
@Injectable()
export class CorsStripperMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[CorsStripperMiddleware] Intercepting request to ${req.method} ${req.path}`);
    console.log(`[CorsStripperMiddleware] Origin header: ${req.headers.origin}`);
    
    // For preflight OPTIONS requests, respond with 204 No Content but without CORS headers
    if (req.method === 'OPTIONS') {
      console.log('[CorsStripperMiddleware] Handling OPTIONS preflight request without CORS');
      res.statusCode = 204;
      res.setHeader('Content-Length', '0');
      return res.end();
    }
    
    // Store the original methods to restore them after next()
    const originalSetHeader = res.setHeader;
    const originalHeader = res.header;
    const originalEnd = res.end;
    const originalJson = res.json;
    
    // Override the setHeader function to block CORS headers for this route
    res.setHeader = function(name: string, value: any): any {
      if (name.toLowerCase().startsWith('access-control-')) {
        console.log(`[CorsStripperMiddleware] Blocking setHeader for CORS header: ${name}=${value}`);
        return this;
      }
      
      // Otherwise, use the original setHeader function
      return originalSetHeader.call(this, name, value);
    };
    
    // Also override the header method
    res.header = function(field: any, val?: string): any {
      if (field && typeof field === 'string' && field.toLowerCase().startsWith('access-control-')) {
        console.log(`[CorsStripperMiddleware] Blocking header for CORS header: ${field}=${val}`);
        return this;
      }
      
      // Otherwise, use the original header function
      return originalHeader.call(this, field, val);
    };
    
    // Override json to ensure we can check headers before sending
    res.json = function(body?: any): any {
      // Delete any CORS headers that might have been set after our middleware
      console.log('[CorsStripperMiddleware] Checking for CORS headers before sending JSON response');
      
      if (res.getHeader('access-control-allow-origin')) {
        console.log(`[CorsStripperMiddleware] Found CORS header that needs removing: access-control-allow-origin = ${res.getHeader('access-control-allow-origin')}`);
        res.removeHeader('access-control-allow-origin');
      }
      
      if (res.getHeader('access-control-allow-credentials')) {
        console.log(`[CorsStripperMiddleware] Found CORS header that needs removing: access-control-allow-credentials = ${res.getHeader('access-control-allow-credentials')}`);
        res.removeHeader('access-control-allow-credentials');
      }
      
      if (res.getHeader('access-control-allow-methods')) {
        console.log(`[CorsStripperMiddleware] Found CORS header that needs removing: access-control-allow-methods = ${res.getHeader('access-control-allow-methods')}`);
        res.removeHeader('access-control-allow-methods');
      }
      
      if (res.getHeader('access-control-allow-headers')) {
        console.log(`[CorsStripperMiddleware] Found CORS header that needs removing: access-control-allow-headers = ${res.getHeader('access-control-allow-headers')}`);
        res.removeHeader('access-control-allow-headers');
      }
      
      // Call the original json method
      return originalJson.call(this, body);
    };
    
    // Override end to ensure we can check headers before sending
    res.end = function(this: any, ...args: any[]): any {
      // Last check for any CORS headers
      console.log('[CorsStripperMiddleware] Final check for CORS headers before response end');
      
      res.removeHeader('access-control-allow-origin');
      res.removeHeader('access-control-allow-credentials');
      res.removeHeader('access-control-allow-methods');
      res.removeHeader('access-control-allow-headers');
      res.removeHeader('access-control-max-age');
      
      // Call original end with all arguments
      return originalEnd.apply(this, args);
    };

    // Continue to the next middleware
    next();
    
    console.log('[CorsStripperMiddleware] After next() middleware chain');
  }
} 