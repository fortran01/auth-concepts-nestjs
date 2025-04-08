import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../src/auth/token/token.service';
import { User } from '../../src/auth/users/users.service';
import { JwtPayload } from '../../src/auth/token/jwt.strategy';

describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser: Partial<User> = {
    userId: 1,
    username: 'admin',
  };

  const mockPayload: JwtPayload = {
    sub: mockUser.userId,
    username: mockUser.username,
  };

  const mockToken = 'mock.jwt.token';
  const mockSecret = 'test-jwt-secret';

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useFactory: () => ({
            sign: jest.fn().mockReturnValue(mockToken),
            verify: jest.fn().mockReturnValue(mockPayload),
          }),
        },
        {
          provide: ConfigService,
          useFactory: () => ({
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return mockSecret;
              return null;
            }),
          }),
        },
      ],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  describe('generateToken', () => {
    it('should generate a JWT token with correct payload and options', async () => {
      // Act
      const result = await tokenService.generateToken(mockUser);

      // Assert
      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.userId, username: mockUser.username },
        {
          secret: mockSecret,
          expiresIn: '1h',
        },
      );
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use default secret when JWT_SECRET is not configured', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue(null);

      // Act
      const result = await tokenService.generateToken(mockUser);

      // Assert
      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          secret: 'your-secret-key-for-development-only',
        }),
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid JWT token and return payload', async () => {
      // Arrange
      const token = mockToken;

      // Act
      const result = await tokenService.verifyToken(token);

      // Assert
      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: mockSecret,
      });
    });

    it('should throw an error when token verification fails', async () => {
      // Arrange
      const token = 'invalid.token';
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Token validation error');
      });

      // Act & Assert
      await expect(tokenService.verifyToken(token)).rejects.toThrow('Invalid token');
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: mockSecret,
      });
    });

    it('should use default secret when JWT_SECRET is not configured', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue(null);
      const token = mockToken;

      // Act
      const result = await tokenService.verifyToken(token);

      // Assert
      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'your-secret-key-for-development-only',
      });
    });
  });
}); 