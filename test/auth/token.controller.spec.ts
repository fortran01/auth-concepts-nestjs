import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TokenController } from '../../src/auth/token/token.controller';
import { AuthService } from '../../src/auth/auth.service';
import { TokenService } from '../../src/auth/token/token.service';
import { Response, Request } from 'express';

describe('TokenController', () => {
  let controller: TokenController;
  let authService: AuthService;
  let tokenService: TokenService;

  const mockUser = {
    userId: 1,
    username: 'admin',
  };

  const mockToken = 'mock.jwt.token';

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TokenController],
      providers: [
        {
          provide: AuthService,
          useFactory: () => ({
            validateUser: jest.fn(),
          }),
        },
        {
          provide: TokenService,
          useFactory: () => ({
            generateToken: jest.fn(),
            verifyToken: jest.fn(),
          }),
        },
      ],
    }).compile();

    controller = moduleRef.get<TokenController>(TokenController);
    authService = moduleRef.get<AuthService>(AuthService);
    tokenService = moduleRef.get<TokenService>(TokenService);
  });

  describe('login', () => {
    it('should return token response with valid credentials', async () => {
      // Arrange
      const loginDto = {
        username: 'admin',
        password: 'secret',
      };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(tokenService, 'generateToken').mockResolvedValue(mockToken);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: mockToken,
        expires_in: 3600,
        token_type: 'Bearer',
      });
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.username, loginDto.password);
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      // Arrange
      const loginDto = {
        username: 'admin',
        password: 'wrong',
      };
      jest.spyOn(authService, 'validateUser').mockRejectedValue(new UnauthorizedException());

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.username, loginDto.password);
    });
  });

  describe('getTokenLoginPage', () => {
    it('should render the token login page', async () => {
      // Arrange
      const res = {
        render: jest.fn(),
      } as unknown as Response;

      // Act
      await controller.getTokenLoginPage(res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('token-login', {
        title: 'Token-based Login',
        message: 'Please log in to get a JWT token',
      });
    });
  });

  describe('getTokenProtected', () => {
    it('should render protected page without auth header', async () => {
      // Arrange
      const req = {
        headers: {},
      } as unknown as Request;
      const res = {
        render: jest.fn(),
      } as unknown as Response;

      // Act
      await controller.getTokenProtected(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('token-protected', {
        title: 'Token Protected',
        message: 'This page is protected by JWT token authentication.',
        error: null
      });
    });

    it('should render protected page with valid token', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer valid.token',
        },
      } as unknown as Request;
      const res = {
        render: jest.fn(),
      } as unknown as Response;
      
      jest.spyOn(tokenService, 'verifyToken').mockResolvedValue({
        sub: mockUser.userId,
        username: mockUser.username,
      });

      // Act
      await controller.getTokenProtected(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('token-protected', {
        title: 'Token Protected',
        message: `Hello ${mockUser.username}! This page is protected by JWT token authentication.`,
        user: {
          userId: mockUser.userId,
          username: mockUser.username
        },
        error: null
      });
      expect(tokenService.verifyToken).toHaveBeenCalledWith('valid.token');
    });

    it('should render protected page with error for invalid token format', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Invalid format',
        },
      } as unknown as Request;
      const res = {
        render: jest.fn(),
      } as unknown as Response;

      // Act
      await controller.getTokenProtected(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('token-protected', {
        title: 'Token Protected',
        message: 'This page is protected by JWT token authentication.',
        error: 'Invalid or expired token. Please log in again.'
      });
    });

    it('should render protected page with error for invalid token', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer invalid.token',
        },
      } as unknown as Request;
      const res = {
        render: jest.fn(),
      } as unknown as Response;
      
      jest.spyOn(tokenService, 'verifyToken').mockRejectedValue(new Error('Invalid token'));

      // Act
      await controller.getTokenProtected(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('token-protected', {
        title: 'Token Protected',
        message: 'This page is protected by JWT token authentication.',
        error: 'Invalid or expired token. Please log in again.'
      });
      expect(tokenService.verifyToken).toHaveBeenCalledWith('invalid.token');
    });
  });

  describe('getTokenData', () => {
    it('should return user data and timestamp', async () => {
      // Arrange
      const req = {
        user: mockUser,
      } as unknown as Request & { user: typeof mockUser };
      
      // Mock Date.now for consistent testing
      const fixedDate = new Date('2023-01-01T00:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);

      // Act
      const result = await controller.getTokenData(req);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        timestamp: fixedDate.toISOString(),
      });
    });
  });
}); 