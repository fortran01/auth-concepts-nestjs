export interface Auth0JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string[] | string;
  iat?: number;
  exp?: number;
  azp?: string;
  scope?: string;
  permissions?: string[];
} 