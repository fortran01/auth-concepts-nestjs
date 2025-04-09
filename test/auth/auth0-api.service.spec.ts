import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Auth0ApiService } from '../../src/auth/auth0/auth0-api.service';
import { Logger } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth0ApiService', () => {
  let service: Auth0ApiService;
  let configService: ConfigService;
  let loggerSpy: jest.SpyInstance;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'AUTH0_DOMAIN':
          return 'test-domain.auth0.com';
        case 'AUTH0_M2M_CLIENT_ID':
          return 'test-m2m-client-id';
        case 'AUTH0_M2M_CLIENT_SECRET':
          return 'test-m2m-client-secret';
        case 'AUTH0_API_AUDIENCE':
          return 'https://api.example.com';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0ApiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<Auth0ApiService>(Auth0ApiService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Mock the logger to prevent console output during tests
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getM2MToken', () => {
    it('should fetch M2M token successfully', async () => {
      // Arrange
      const mockTokenResponse = {
        access_token: 'test-m2m-access-token',
        expires_in: 86400,
        token_type: 'Bearer',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      // Act
      const result = await service.getM2MToken();

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-domain.auth0.com/oauth/token',
        {
          grant_type: 'client_credentials',
          client_id: 'test-m2m-client-id',
          client_secret: 'test-m2m-client-secret',
          audience: 'https://api.example.com',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error when missing configuration', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      // Act & Assert
      await expect(service.getM2MToken()).rejects.toThrow(
        'Missing required Auth0 configuration'
      );
    });

    it('should handle Auth0 API error response correctly', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: 'access_denied',
            error_description: 'Unauthorized',
          },
          headers: {},
        },
      };
      
      // Reset the mock first to ensure it returns the defaults
      jest.clearAllMocks();
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'AUTH0_DOMAIN':
            return 'test-domain.auth0.com';
          case 'AUTH0_M2M_CLIENT_ID':
            return 'test-m2m-client-id';
          case 'AUTH0_M2M_CLIENT_SECRET':
            return 'test-m2m-client-secret';
          case 'AUTH0_API_AUDIENCE':
            return 'https://api.example.com';
          default:
            return undefined;
        }
      });
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      // Act & Assert
      await expect(service.getM2MToken()).rejects.toThrow(
        'Unauthorized: Check if M2M client ID and secret are correct'
      );
    });

    it('should handle invalid client error response', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: 'invalid_client',
            error_description: 'Client authentication failed',
          },
          headers: {},
        },
      };
      
      // Reset the mock first to ensure it returns the defaults
      jest.clearAllMocks();
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'AUTH0_DOMAIN':
            return 'test-domain.auth0.com';
          case 'AUTH0_M2M_CLIENT_ID':
            return 'test-m2m-client-id';
          case 'AUTH0_M2M_CLIENT_SECRET':
            return 'test-m2m-client-secret';
          case 'AUTH0_API_AUDIENCE':
            return 'https://api.example.com';
          default:
            return undefined;
        }
      });
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      // Act & Assert
      await expect(service.getM2MToken()).rejects.toThrow(
        'Invalid client: The M2M client ID or secret is incorrect'
      );
    });

    it('should handle network errors', async () => {
      // Arrange
      // Reset the mock first to ensure it returns the defaults
      jest.clearAllMocks();
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'AUTH0_DOMAIN':
            return 'test-domain.auth0.com';
          case 'AUTH0_M2M_CLIENT_ID':
            return 'test-m2m-client-id';
          case 'AUTH0_M2M_CLIENT_SECRET':
            return 'test-m2m-client-secret';
          case 'AUTH0_API_AUDIENCE':
            return 'https://api.example.com';
          default:
            return undefined;
        }
      });
      
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(service.getM2MToken()).rejects.toThrow(
        'Failed to get M2M token from Auth0'
      );
    });
  });

  describe('hasRequiredScopes', () => {
    it('should return true when token has all required scopes', () => {
      // Arrange
      const scopesString = 'read:users write:users delete:users';
      const requiredScopes = ['read:users', 'write:users'];

      // Act
      const result = service.hasRequiredScopes(scopesString, requiredScopes);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token is missing some required scopes', () => {
      // Arrange
      const scopesString = 'read:users';
      const requiredScopes = ['read:users', 'write:users'];

      // Act
      const result = service.hasRequiredScopes(scopesString, requiredScopes);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when scopesString is empty', () => {
      // Act
      const result = service.hasRequiredScopes('', ['read:users']);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when scopesString is undefined', () => {
      // Act
      const result = service.hasRequiredScopes(undefined, ['read:users']);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when requiredScopes is empty', () => {
      // Act
      const result = service.hasRequiredScopes('read:users', []);

      // Assert
      expect(result).toBe(true);
    });
  });
}); 