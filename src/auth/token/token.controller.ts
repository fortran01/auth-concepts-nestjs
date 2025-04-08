import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { TokenService } from './token.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

// Define DTOs
class LoginDto {
  username: string;
  password: string;
}

// Define interfaces for response
interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface UserData {
  userId: number;
  username: string;
}

@Controller('token')
export class TokenController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  // Login endpoint that returns a JWT token
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponse> {
    try {
      const user = await this.authService.validateUser(loginDto.username, loginDto.password);
      const token = await this.tokenService.generateToken(user);
      
      return {
        access_token: token,
        expires_in: 3600, // 1 hour in seconds
        token_type: 'Bearer',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  // Login page for token-based auth
  @Get('login')
  async getTokenLoginPage(@Res() res: Response) {
    return res.render('token-login', {
      title: 'Token-based Login',
      message: 'Please log in to get a JWT token',
    });
  }

  // Protected page that requires a valid JWT token
  @Get('protected')
  async getTokenProtected(@Req() req: Request, @Res() res: Response) {
    const authHeader = req.headers.authorization;
    
    // If no auth header, try to check if this is a browser request
    if (!authHeader) {
      // Render the page but client-side JS will handle the token check
      return res.render('token-protected', {
        title: 'Token Protected',
        message: 'This page is protected by JWT token authentication.',
        error: null
      });
    }
    
    // If auth header exists, validate the token
    try {
      if (!authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid token format');
      }
      
      const token = authHeader.split(' ')[1];
      const payload = await this.tokenService.verifyToken(token);
      
      // Successfully validated token
      return res.render('token-protected', {
        title: 'Token Protected',
        message: `Hello ${payload.username}! This page is protected by JWT token authentication.`,
        user: {
          userId: payload.sub,
          username: payload.username
        },
        error: null
      });
    } catch (error) {
      // If token validation fails, render page with error
      return res.render('token-protected', {
        title: 'Token Protected',
        message: 'This page is protected by JWT token authentication.',
        error: 'Invalid or expired token. Please log in again.'
      });
    }
  }

  // API endpoint to get user data from token
  @Get('data')
  @UseGuards(JwtAuthGuard)
  async getTokenData(@Req() req: Request & { user: UserData }) {
    return {
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
} 