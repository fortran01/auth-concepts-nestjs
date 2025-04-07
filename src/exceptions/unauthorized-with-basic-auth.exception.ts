import { UnauthorizedException } from '@nestjs/common';

export class UnauthorizedWithBasicAuthException extends UnauthorizedException {
  constructor(message?: string) {
    super(message);
  }

  getResponse() {
    const response = super.getResponse();
    if (typeof response === 'object') {
      return {
        ...response,
        headers: {
          'WWW-Authenticate': 'Basic realm="Login Required"'
        }
      };
    }
    return response;
  }
} 