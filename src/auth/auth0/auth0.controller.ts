import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Auth0Service } from './auth0.service';

@Controller('auth0')
export class Auth0Controller {
  constructor(
    private auth0Service: Auth0Service,
    private configService: ConfigService,
  ) {}
  
  @Get('login')
  async login(@Res() res: Response) {
    // Redirect to Auth0 login page
    res.redirect(
      `https://${this.configService.get<string>('AUTH0_DOMAIN')}/authorize?` +
      `response_type=code&` +
      `client_id=${this.configService.get<string>('AUTH0_CLIENT_ID')}&` +
      `redirect_uri=${this.configService.get<string>('AUTH0_CALLBACK_URL')}&` +
      `scope=openid profile email`
    );
  }
  
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    try {
      const { code } = req.query;
      if (!code) {
        return res.redirect('/');
      }
      
      // Exchange code for tokens
      const tokenResponse = await this.auth0Service.exchangeCodeForTokens(code.toString());
      
      // Get user profile
      const userProfile = await this.auth0Service.getUserProfile(tokenResponse.access_token);
      
      // Store user information in session
      req.session['auth0User'] = userProfile;
      req.session['auth0Tokens'] = tokenResponse;
      
      return res.redirect('/auth0/profile');
    } catch (error) {
      console.error('Auth0 callback error:', error);
      return res.redirect('/?error=authentication_failed');
    }
  }
  
  @Get('profile')
  async profile(@Req() req: Request, @Res() res: Response) {
    // Check if user is authenticated
    if (!req.session['auth0User']) {
      return res.redirect('/auth0/login');
    }
    
    return res.render('auth0-profile', {
      user: req.session['auth0User'],
      title: 'Auth0 Profile',
    });
  }
  
  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    // Clear session
    req.session['auth0User'] = null;
    req.session['auth0Tokens'] = null;
    
    // Redirect to Auth0 logout
    res.redirect(
      `https://${this.configService.get<string>('AUTH0_DOMAIN')}/v2/logout?` +
      `client_id=${this.configService.get<string>('AUTH0_CLIENT_ID')}&` +
      `returnTo=${encodeURIComponent(this.configService.get<string>('AUTH0_LOGOUT_URL') || 'http://localhost:3000')}`
    );
  }
} 