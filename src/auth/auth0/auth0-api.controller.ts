import { Controller, Get, UseGuards, Req, Post, Body } from '@nestjs/common';
import { Auth0JwtGuard } from './auth0-jwt.guard';
import { Request } from 'express';
import { Auth0JwtPayload } from './interfaces/auth0-jwt-payload.interface';

interface ApiResponse {
  message: string;
  data?: any;
  user?: any;
}

@Controller('api/auth0')
export class Auth0ApiController {
  @Get('public')
  getPublicResource(): ApiResponse {
    return {
      message: 'This is a public API endpoint that anyone can access',
      data: {
        publicInfo: 'Public information that does not require authentication',
      },
    };
  }

  @UseGuards(Auth0JwtGuard)
  @Get('protected')
  getProtectedResource(@Req() req: Request): ApiResponse {
    const user = req.user as Auth0JwtPayload;
    
    return {
      message: 'You have accessed a protected API endpoint',
      data: {
        protectedInfo: 'This data is only accessible with a valid Auth0 token',
        timestamp: new Date().toISOString(),
      },
      user: {
        sub: user.sub,
        permissions: user.permissions || [],
        scope: user.scope,
      },
    };
  }

  @UseGuards(Auth0JwtGuard)
  @Post('data')
  createData(@Body() data: any, @Req() req: Request): ApiResponse {
    const user = req.user as Auth0JwtPayload;
    
    return {
      message: 'Data successfully created',
      data: {
        received: data,
        created: true,
        timestamp: new Date().toISOString(),
      },
      user: {
        sub: user.sub,
      },
    };
  }
} 