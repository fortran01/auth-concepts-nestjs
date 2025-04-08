import { Controller, Get, Post, UseGuards, Req, Res, Body, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { LocalAuthGuard } from './local-auth.guard';
import { SessionGuard } from './session.guard';
import { SessionService } from './session.service';

// Add a declaration to enhance Express Request
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
    flash?: any;
    logout?: any;
    isAuthenticated?: any;
    logIn?: any;
    session?: any;
  }
}

// We'll use the standard Express Request but cast as needed
@Controller('auth/session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Get('login')
  getLogin(@Req() req: Request, @Res() res: Response) {
    // Pass error messages if they exist
    const errorMessages = req.flash ? req.flash('error') : [];
    
    return res.render('login', {
      title: 'Login',
      error: errorMessages.length > 0 ? errorMessages[0] : null,
      flash: {
        success: req.flash ? req.flash('success') : [],
        info: req.flash ? req.flash('info') : [],
        error: errorMessages,
      }
    });
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async postLogin(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    
    // If user has MFA enabled, redirect to MFA verification
    if (user && user.mfaEnabled) {
      if (req.flash) {
        req.flash('info', 'Please verify your identity with MFA');
      }
      return res.redirect('/auth/session/verify-mfa');
    }
    
    if (req.flash) {
      req.flash('success', 'You have successfully logged in!');
    }
    return res.redirect('/auth/session/protected');
  }

  @UseGuards(SessionGuard)
  @Get('protected')
  async getProtected(@Req() req: Request, @Res() res: Response) {
    // Add flash messages to template data
    const flash = {
      success: req.flash ? req.flash('success') : [],
      info: req.flash ? req.flash('info') : [],
      error: req.flash ? req.flash('error') : [],
    };
    
    return res.render('session-auth', {
      title: 'Session Auth',
      message: `Hello ${req.user?.username}! This page uses Session Authentication.`,
      user: req.user,
      flash,
    });
  }

  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
        }
        if (req.flash) {
          req.flash('info', 'You have been logged out');
        }
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  }

  @UseGuards(SessionGuard)
  @Get('setup-mfa')
  async getSetupMfa(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      return res.redirect('/auth/session/login');
    }
    
    // Generate a new MFA secret
    const secret = await this.sessionService.setupMfa(req.user.userId);
    
    // Store the secret temporarily in the session
    if (req.session) {
      req.session.temp_mfa_secret = secret;
    }
    
    // Add flash messages to template data
    const flash = {
      success: req.flash ? req.flash('success') : [],
      info: req.flash ? req.flash('info') : [],
      error: req.flash ? req.flash('error') : [],
    };
    
    return res.render('setup-mfa', {
      title: 'Setup MFA',
      secret,
      flash,
    });
  }

  @UseGuards(SessionGuard)
  @Post('setup-mfa')
  async postSetupMfa(
    @Req() req: Request,
    @Res() res: Response,
    @Body('token') token: string,
  ) {
    if (!req.user) {
      return res.redirect('/auth/session/login');
    }
    
    if (!token) {
      if (req.flash) {
        req.flash('error', 'Token is required');
      }
      return res.redirect('/auth/session/setup-mfa');
    }
    
    // Get the secret from the session
    const tempSecret = req.session?.temp_mfa_secret;
    if (!tempSecret) {
      if (req.flash) {
        req.flash('error', 'MFA setup session expired. Please try again.');
      }
      return res.redirect('/auth/session/setup-mfa');
    }
    
    // Verify using the temporary secret from the session
    const isValid = await this.sessionService.verifyWithSecret(token, tempSecret);
    if (!isValid) {
      if (req.flash) {
        req.flash('error', 'Invalid token');
      }
      return res.redirect('/auth/session/setup-mfa');
    }
    
    // Enable MFA for the user with the verified secret
    await this.sessionService.enableMfa(req.user.userId, tempSecret);
    
    // Remove the temporary secret from the session
    if (req.session) {
      delete req.session.temp_mfa_secret;
    }
    
    // Update the user in the session
    const updatedUser = {
      ...req.user,
      mfaEnabled: true,
    };
    
    if (req.logIn) {
      req.logIn(updatedUser, (err) => {
        if (err) {
          if (req.flash) {
            req.flash('error', 'An error occurred');
          }
          return res.redirect('/auth/session/setup-mfa');
        }
        
        if (req.flash) {
          req.flash('success', 'MFA has been successfully set up');
        }
        return res.redirect('/auth/session/protected');
      });
    } else {
      if (req.flash) {
        req.flash('error', 'Session login not available');
      }
      res.redirect('/auth/session/login');
    }
  }

  @UseGuards(SessionGuard)
  @Get('verify-mfa')
  getVerifyMfa(@Req() req: Request, @Res() res: Response) {
    // Add flash messages to template data
    const flash = {
      success: req.flash ? req.flash('success') : [],
      info: req.flash ? req.flash('info') : [],
      error: req.flash ? req.flash('error') : [],
    };
    
    return res.render('verify-mfa', {
      title: 'Verify MFA',
      flash,
    });
  }

  @UseGuards(SessionGuard)
  @Post('verify-mfa')
  async postVerifyMfa(
    @Req() req: Request,
    @Res() res: Response,
    @Body('token') token: string,
  ) {
    if (!req.user) {
      return res.redirect('/auth/session/login');
    }
    
    if (!token) {
      if (req.flash) {
        req.flash('error', 'Token is required');
      }
      return res.redirect('/auth/session/verify-mfa');
    }
    
    const isValid = await this.sessionService.verifyMfa(req.user.userId, token);
    if (!isValid) {
      if (req.flash) {
        req.flash('error', 'Invalid token');
      }
      return res.redirect('/auth/session/verify-mfa');
    }
    
    if (req.flash) {
      req.flash('success', 'MFA verification successful');
    }
    return res.redirect('/auth/session/protected');
  }

  @UseGuards(SessionGuard)
  @Get('get-mfa-secret')
  async getMfaSecret(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get the user's MFA secret
    const user = await this.sessionService.getUser(req.user.userId);
    if (!user || !user.mfaSecret) {
      return res.status(404).json({ error: 'No MFA secret found' });
    }
    
    // Return the secret for demo purposes only
    // In a real app, we would NEVER expose the secret after initial setup
    return res.json({ secret: user.mfaSecret });
  }
} 