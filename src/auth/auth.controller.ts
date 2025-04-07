import { Controller, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('basic')
  async getBasicProtected(@Req() req: Request, @Res() res: Response) {
    // Check for auth header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
      return res.status(401).send();
    }
    
    // Extract and validate credentials
    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');
      
      if (!username || !password) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
        return res.status(401).send();
      }
      
      const user = await this.authService.validateUser(username, password);
      
      // Render the page on success
      return res.render('basic-auth', {
        title: 'Basic Auth',
        message: `Hello ${user.username}! This page uses Basic Auth.`,
        user: user,
      });
    } catch (error) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
      return res.status(401).send();
    }
  }
} 