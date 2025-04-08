import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-for-development-only',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [TokenService, JwtStrategy, AuthService, UsersService],
  controllers: [TokenController],
  exports: [TokenService],
})
export class TokenModule {} 