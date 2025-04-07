import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
      return res.status(401).json({
        statusCode: 401,
        message: 'Missing or invalid authorization header',
      });
    }

    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      if (!username || !password) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
        return res.status(401).json({
          statusCode: 401,
          message: 'Invalid credentials format',
        });
      }

      const user = await this.authService.validateUser(username, password);
      req['user'] = user;
      next();
    } catch (error) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
      return res.status(401).json({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }
  }
} 