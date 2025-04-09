import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Auth0Controller } from '../../src/auth/auth0/auth0.controller';
import { Auth0Service } from '../../src/auth/auth0/auth0.service';

describe('Auth0Controller', () => {
  let controller: Auth0Controller;
  let auth0Service: Auth0Service;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'AUTH0_DOMAIN':
          return 'test-domain.auth0.com';
        case 'AUTH0_CLIENT_ID':
          return 'test-client-id';
        case 'AUTH0_CALLBACK_URL':
          return 'http://localhost:3000/auth0/callback';
        case 'AUTH0_LOGOUT_URL':
          return 'http://localhost:3000';
        default:
          return undefined;
      }
    }),
  };

  const mockAuth0Service = {
    exchangeCodeForTokens: jest.fn(),
    getUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Auth0Controller],
      providers: [
        { provide: Auth0Service, useValue: mockAuth0Service },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<Auth0Controller>(Auth0Controller);
    auth0Service = module.get<Auth0Service>(Auth0Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should redirect to Auth0 login page', async () => {
      // Arrange
      const res = {
        redirect: jest.fn(),
      };

      // Act
      await controller.login(res as any);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        'https://test-domain.auth0.com/authorize?' +
        'response_type=code&' +
        'client_id=test-client-id&' +
        'redirect_uri=http://localhost:3000/auth0/callback&' +
        'scope=openid profile email'
      );
    });
  });

  describe('callback', () => {
    it('should redirect to profile page on successful authentication', async () => {
      // Arrange
      const mockCode = 'test-code';
      const mockTokenResponse = {
        access_token: 'test-access-token',
        id_token: 'test-id-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      const mockUserProfile = {
        sub: 'auth0|123456',
        name: 'Test User',
        email: 'test@example.com',
      };

      const req = {
        query: { code: mockCode },
        session: {},
      };
      const res = {
        redirect: jest.fn(),
      };

      mockAuth0Service.exchangeCodeForTokens.mockResolvedValue(mockTokenResponse);
      mockAuth0Service.getUserProfile.mockResolvedValue(mockUserProfile);

      // Act
      await controller.callback(req as any, res as any);

      // Assert
      expect(mockAuth0Service.exchangeCodeForTokens).toHaveBeenCalledWith(mockCode);
      expect(mockAuth0Service.getUserProfile).toHaveBeenCalledWith(mockTokenResponse.access_token);
      expect(req.session['auth0User']).toEqual(mockUserProfile);
      expect(req.session['auth0Tokens']).toEqual(mockTokenResponse);
      expect(res.redirect).toHaveBeenCalledWith('/auth0/profile');
    });

    it('should redirect to home with error when code is missing', async () => {
      // Arrange
      const req = {
        query: {},
        session: {},
      };
      const res = {
        redirect: jest.fn(),
      };

      // Act
      await controller.callback(req as any, res as any);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to error page when token exchange fails', async () => {
      // Arrange
      const mockCode = 'invalid-code';
      const req = {
        query: { code: mockCode },
        session: {},
      };
      const res = {
        redirect: jest.fn(),
      };

      mockAuth0Service.exchangeCodeForTokens.mockRejectedValue(new Error('Token exchange failed'));

      // Act
      await controller.callback(req as any, res as any);

      // Assert
      expect(mockAuth0Service.exchangeCodeForTokens).toHaveBeenCalledWith(mockCode);
      expect(res.redirect).toHaveBeenCalledWith('/?error=authentication_failed');
    });
  });

  describe('profile', () => {
    it('should render profile page when user is authenticated', async () => {
      // Arrange
      const mockUserProfile = {
        sub: 'auth0|123456',
        name: 'Test User',
        email: 'test@example.com',
      };
      
      const req = {
        session: {
          auth0User: mockUserProfile,
        },
      };
      
      const res = {
        render: jest.fn(),
      };

      // Act
      await controller.profile(req as any, res as any);

      // Assert
      expect(res.render).toHaveBeenCalledWith('auth0-profile', {
        user: mockUserProfile,
        title: 'Auth0 Profile',
      });
    });

    it('should redirect to login when user is not authenticated', async () => {
      // Arrange
      const req = {
        session: {},
      };
      
      const res = {
        redirect: jest.fn(),
      };

      // Act
      await controller.profile(req as any, res as any);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/auth0/login');
    });
  });

  describe('logout', () => {
    it('should clear session and redirect to Auth0 logout', async () => {
      // Arrange
      const req = {
        session: {
          auth0User: { name: 'Test User' },
          auth0Tokens: { access_token: 'test-token' },
        },
      };
      
      const res = {
        redirect: jest.fn(),
      };

      // Act
      await controller.logout(req as any, res as any);

      // Assert
      expect(req.session['auth0User']).toBeNull();
      expect(req.session['auth0Tokens']).toBeNull();
      expect(res.redirect).toHaveBeenCalledWith(
        'https://test-domain.auth0.com/v2/logout?' +
        'client_id=test-client-id&' +
        'returnTo=http%3A%2F%2Flocalhost%3A3000'
      );
    });
  });
}); 