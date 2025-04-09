import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Auth0JwtGuard extends AuthGuard('auth0-jwt') {} 