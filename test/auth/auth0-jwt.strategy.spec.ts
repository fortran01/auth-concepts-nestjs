import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Auth0JwtStrategy } from '../../src/auth/auth0/auth0-jwt.strategy';
import { Auth0JwtPayload } from '../../src/auth/auth0/interfaces/auth0-jwt-payload.interface';

describe('Auth0JwtStrategy', () => {
  let strategy: Auth0JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'AUTH0_DOMAIN') return 'example.auth0.com';
      if (key === 'AUTH0_API_AUDIENCE') return 'https://api.example.com';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<Auth0JwtStrategy>(Auth0JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the payload as is', async () => {
      const mockPayload: Auth0JwtPayload = {
        sub: 'auth0|123456',
        iss: 'https://example.auth0.com/',
        aud: 'https://api.example.com',
        iat: 1617019624,
        exp: 1617106024,
        scope: 'read:data write:data',
        permissions: ['read:data', 'write:data'],
      };

      const result = await strategy.validate(mockPayload);
      expect(result).toEqual(mockPayload);
    });
  });
}); 