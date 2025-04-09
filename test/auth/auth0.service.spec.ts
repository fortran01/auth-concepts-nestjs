import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Auth0Service } from '../../src/auth/auth0/auth0.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth0Service', () => {
  let service: Auth0Service;
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
        Auth0Service,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<Auth0Service>(Auth0Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange auth code for tokens', async () => {
      // Arrange
      const mockCode = 'test-auth-code';
      const mockTokenResponse = {
        access_token: 'test-access-token',
        id_token: 'test-id-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      // Act
      const result = await service.exchangeCodeForTokens(mockCode);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-domain.auth0.com/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          code: mockCode,
          redirect_uri: 'http://localhost:3000/auth0/callback',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw an error when token request fails', async () => {
      // Arrange
      const mockCode = 'invalid-code';
      const errorMessage = 'Invalid authorization code';
      
      mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(service.exchangeCodeForTokens(mockCode)).rejects.toThrow();
    });
  });

  describe('getUserProfile', () => {
    it('should retrieve user profile with access token', async () => {
      // Arrange
      const mockAccessToken = 'test-access-token';
      const mockUserProfile = {
        sub: 'auth0|123456',
        nickname: 'testuser',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
        updated_at: '2023-04-01T12:00:00.000Z',
        email: 'test@example.com',
        email_verified: true,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUserProfile });

      // Act
      const result = await service.getUserProfile(mockAccessToken);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-domain.auth0.com/userinfo',
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        },
      );
      expect(result).toEqual(mockUserProfile);
    });

    it('should throw an error when userinfo request fails', async () => {
      // Arrange
      const mockAccessToken = 'invalid-token';
      const errorMessage = 'Invalid access token';
      
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(service.getUserProfile(mockAccessToken)).rejects.toThrow();
    });
  });
}); 