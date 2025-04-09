import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Auth0Controller } from './auth0.controller';
import { Auth0Service } from './auth0.service';
import { Auth0Strategy } from './auth0.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'auth0' }),
  ],
  controllers: [Auth0Controller],
  providers: [Auth0Service, Auth0Strategy],
  exports: [Auth0Service],
})
export class Auth0Module {} 