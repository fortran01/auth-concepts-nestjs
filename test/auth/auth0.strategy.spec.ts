import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Auth0Strategy } from '../../src/auth/auth0/auth0.strategy';

// Skip constructor tests and only test validate method
describe('Auth0Strategy', () => {
  let strategy: Auth0Strategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'AUTH0_DOMAIN':
          return 'test-domain.auth0.com';
        case 'AUTH0_CLIENT_ID':
          return 'test-client-id';
        case 'AUTH0_CLIENT_SECRET':
          return 'test-client-secret';
        case 'AUTH0_CALLBACK_URL':
          return 'http://localhost:3000/auth0/callback';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0Strategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<Auth0Strategy>(Auth0Strategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validate', () => {
    it('should return user object from Auth0 profile', async () => {
      // Arrange
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      const extraParams = { id_token: 'test-id-token' };
      const profile = {
        id: 'auth0|123456',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
        picture: 'https://example.com/picture.jpg',
      };
      const done = jest.fn();

      // Act
      await strategy.validate(
        accessToken,
        refreshToken,
        extraParams,
        profile,
        done,
      );

      // Assert
      expect(done).toHaveBeenCalledWith(null, {
        auth0Id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.picture,
        accessToken,
      });
    });

    it('should handle missing email in profile', async () => {
      // Arrange
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      const extraParams = { id_token: 'test-id-token' };
      const profile = {
        id: 'auth0|123456',
        displayName: 'Test User',
        emails: [],
        picture: 'https://example.com/picture.jpg',
      };
      const done = jest.fn();

      // Act
      await strategy.validate(
        accessToken,
        refreshToken,
        extraParams,
        profile,
        done,
      );

      // Assert
      expect(done).toHaveBeenCalledWith(null, {
        auth0Id: profile.id,
        email: undefined,
        name: profile.displayName,
        picture: profile.picture,
        accessToken,
      });
    });
  });

  // Config testing - simplified
  describe('configuration', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should use config values', () => {
      expect(configService.get).toHaveBeenCalledWith('AUTH0_DOMAIN');
      expect(configService.get).toHaveBeenCalledWith('AUTH0_CLIENT_ID');
      expect(configService.get).toHaveBeenCalledWith('AUTH0_CLIENT_SECRET');
      expect(configService.get).toHaveBeenCalledWith('AUTH0_CALLBACK_URL');
    });
  });
}); 