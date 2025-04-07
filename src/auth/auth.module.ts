import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from './users/users.service';
import { NonceModule } from './nonce/nonce.module';
import { DigestAuthGuard } from './guards/digest-auth.guard';

@Module({
  imports: [NonceModule],
  providers: [AuthService, UsersService, DigestAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, UsersService],
})
export class AuthModule {} 