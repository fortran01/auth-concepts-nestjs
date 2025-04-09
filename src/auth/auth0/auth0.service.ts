import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

interface UserProfile {
  sub: string;
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
}

@Injectable()
export class Auth0Service {
  constructor(private configService: ConfigService) {}

  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const clientId = this.configService.get<string>('AUTH0_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AUTH0_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('AUTH0_CALLBACK_URL');

    const response = await axios.post(
      `https://${domain}/oauth/token`,
      {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    
    const response = await axios.get(
      `https://${domain}/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  }
} 