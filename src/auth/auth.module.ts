import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from './users/users.service';
import { NonceModule } from './nonce/nonce.module';
import { DigestAuthGuard } from './guards/digest-auth.guard';
import { SessionController } from './session/session.controller';
import { SessionService } from './session/session.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './session/local.strategy';
import { SessionSerializer } from './session/session.serializer';

@Module({
  imports: [
    NonceModule,
    PassportModule.register({ session: true }),
  ],
  providers: [
    AuthService, 
    UsersService, 
    DigestAuthGuard, 
    SessionService,
    LocalStrategy,
    SessionSerializer
  ],
  controllers: [AuthController, SessionController],
  exports: [AuthService, UsersService],
})
export class AuthModule {} 