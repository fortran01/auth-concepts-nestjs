import { Test, TestingModule } from '@nestjs/testing';
import { BasicAuthMiddleware } from '../../src/middleware/basic-auth.middleware';
import { AuthService } from '../../src/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

describe('BasicAuthMiddleware', () => {
  let middleware: BasicAuthMiddleware;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasicAuthMiddleware,
        {
          provide: AuthService,
          useFactory: () => ({
            validateUser: jest.fn(),
          }),
        },
      ],
    }).compile();

    middleware = module.get<BasicAuthMiddleware>(BasicAuthMiddleware);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it('should return 401 when no authorization header', async () => {
      // Act
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: 'Missing or invalid authorization header',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when not Basic auth header', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer token',
      };

      // Act
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: 'Missing or invalid authorization header',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when credentials are invalid format', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Basic invaliddata',
      };

      // Act
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: 'Invalid credentials format',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when auth service throws', async () => {
      // Arrange
      mockRequest.headers = {
        // admin:secret in base64
        authorization: 'Basic YWRtaW46c2VjcmV0',
      };
      jest
        .spyOn(authService, 'validateUser')
        .mockRejectedValue(new UnauthorizedException());

      // Act
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: 'Invalid credentials',
      });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'secret');
    });

    it('should call next and set user when credentials are valid', async () => {
      // Arrange
      mockRequest = {
        headers: {
          // admin:secret in base64
          authorization: 'Basic YWRtaW46c2VjcmV0',
        },
      };
      const user = { userId: 1, username: 'admin' };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      // Act
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      // Assert
      expect(mockRequest['user']).toEqual(user);
      expect(nextFunction).toHaveBeenCalled();
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'secret');
    });
  });
}); 