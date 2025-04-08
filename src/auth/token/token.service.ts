import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';
import { User } from '../users/users.service';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateToken(user: Partial<User>): Promise<string> {
    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key-for-development-only',
      expiresIn: '1h', // Token expires in 1 hour
    });
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key-for-development-only',
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
} 