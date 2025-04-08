import { Controller, Get, Post, Render, Req, Res, Body, Redirect } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsrfService } from './csrf.service';

@Controller('csrf-demo')
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get()
  @Render('csrf-demo')
  getDemo(@Req() req: Request) {
    return {
      title: 'CSRF Vulnerability Demo',
      // Generate a CSRF token for the form
      csrfToken: this.csrfService.generateToken(req),
    };
  }

  @Get('profile')
  @Render('csrf-profile')
  getProfile(@Req() req: Request) {
    // Default email for demo purposes
    const email = req.session['email'] || 'user@example.com';
    
    // Store flash messages to return to the template
    const flash = req.session['flash'] || {};
    
    // Clear flash messages after reading them
    if (req.session['flash']) {
      req.session['flash'] = {};
    }
    
    return {
      title: 'User Profile (Vulnerable to CSRF)',
      email,
      csrfProtected: false,
      flash  // Pass the flash messages to the template
    };
  }

  @Post('update-email')
  @Redirect('/csrf-demo/profile')
  updateEmail(@Req() req: Request, @Body() body: { email: string }) {
    const { email } = body;
    if (email) {
      // Store the new email in the session for demo purposes
      req.session['email'] = email;
      // Set flash message
      if (!req.session['flash']) {
        req.session['flash'] = {};
      }
      req.session['flash']['success'] = ['Email updated successfully!'];
    } else {
      if (!req.session['flash']) {
        req.session['flash'] = {};
      }
      req.session['flash']['danger'] = ['Email cannot be empty'];
    }
    return { url: '/csrf-demo/profile' };
  }

  @Get('profile-protected')
  @Render('csrf-profile-protected')
  getProfileProtected(@Req() req: Request) {
    // Default email for demo purposes
    const email = req.session['email'] || 'user@example.com';
    
    // Default username for the protected demo
    const username = req.session['username'] || 'default_user';
    
    // Check if there was an attack attempt
    const attackAttempted = req.session['csrf_attack_attempted'] || false;
    
    // Clear the attack flag after reading it
    if (req.session['csrf_attack_attempted']) {
      req.session['csrf_attack_attempted'] = false;
      
      // When showing attack notification, ensure we don't show any misleading success messages
      if (req.session['flash'] && req.session['flash']['success']) {
        delete req.session['flash']['success'];
      }
    }
    
    // Store flash messages to return to the template
    const flash = req.session['flash'] || {};
    
    // Clear flash messages after reading them
    if (req.session['flash']) {
      req.session['flash'] = {};
    }
    
    return {
      title: 'User Profile (Protected from CSRF)',
      email,
      username,
      csrfProtected: true,
      csrfToken: this.csrfService.generateToken(req),
      attackAttempted,
      flash  // Pass the flash messages to the template
    };
  }

  @Post('update-username-protected')
  @Redirect('/csrf-demo/profile-protected')
  updateUsernameProtected(
    @Req() req: Request, 
    @Body() body: { username: string, csrf_token: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const { username, csrf_token } = body;
    
    // Check CSRF token
    if (!csrf_token || !this.csrfService.validateToken(req, csrf_token)) {
      // Clear any existing flash messages to avoid confusion
      if (!req.session['flash']) {
        req.session['flash'] = {};
      } else {
        // Clear any success messages to avoid confusion
        if (req.session['flash']['success']) {
          delete req.session['flash']['success'];
        }
      }
      
      // Set CSRF error message
      req.session['flash']['danger'] = ['Invalid CSRF token. This could be a cross-site request forgery attempt!'];
      
      // Set attack attempt flag to show an additional notification
      req.session['csrf_attack_attempted'] = true;
      
      return { url: '/csrf-demo/profile-protected' };
    }
    
    if (username) {
      // Store the new username in the session for demo purposes
      req.session['username'] = username;
      // Set flash message
      if (!req.session['flash']) {
        req.session['flash'] = {};
      }
      req.session['flash']['success'] = ['Username updated successfully!'];
    } else {
      if (!req.session['flash']) {
        req.session['flash'] = {};
      }
      req.session['flash']['danger'] = ['Username cannot be empty'];
    }
    return { url: '/csrf-demo/profile-protected' };
  }

  @Get('malicious-site')
  @Render('csrf-malicious')
  getMaliciousSite(@Req() req: Request) {
    return {
      title: 'Malicious Site (Demo) - Attacks Vulnerable Page',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      targetVulnerable: true,
      targetProtected: false
    };
  }

  @Get('malicious-site-protected')
  @Render('csrf-malicious')
  getMaliciousSiteProtected(@Req() req: Request) {
    return {
      title: 'Malicious Site (Demo) - Attacks Protected Page',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      targetVulnerable: false,
      targetProtected: true
    };
  }
}
