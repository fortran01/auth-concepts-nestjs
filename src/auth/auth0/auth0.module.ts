import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Auth0Controller } from './auth0.controller';
import { Auth0Service } from './auth0.service';
import { Auth0Strategy } from './auth0.strategy';
import { PassportModule } from '@nestjs/passport';
import { Auth0JwtStrategy } from './auth0-jwt.strategy';
import { Auth0ApiController } from './auth0-api.controller';
import { Auth0ApiService } from './auth0-api.service';
import { Auth0ApiDemoController } from './auth0-api-demo.controller';
import { Auth0ApiDebugController } from './auth0-api-debug.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'auth0' }),
  ],
  controllers: [
    Auth0Controller, 
    Auth0ApiController, 
    Auth0ApiDemoController,
    Auth0ApiDebugController
  ],
  providers: [
    Auth0Service, 
    Auth0Strategy,
    Auth0JwtStrategy,
    Auth0ApiService
  ],
  exports: [Auth0Service, Auth0ApiService],
})
export class Auth0Module {} 