import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { DigestAuthGuard } from '../../src/auth/guards/digest-auth.guard';
import { NonceService } from '../../src/auth/nonce/nonce.service';
import { UsersService } from '../../src/auth/users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useFactory: () => ({
            validateUser: jest.fn(),
          }),
        },
        {
          provide: NonceService,
          useFactory: () => ({
            generateNonce: jest.fn().mockReturnValue('mock-nonce'),
            isValidNonce: jest.fn().mockReturnValue(true),
          }),
        },
        {
          provide: UsersService,
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        DigestAuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('getBasicProtected', () => {
    it('should return 401 when no auth header is present', async () => {
      // Arrange
      const req = { 
        headers: {} 
      } as unknown as Request;

      // Act
      await controller.getBasicProtected(req, mockResponse);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 401 when auth header is not basic', async () => {
      // Arrange
      const req = { 
        headers: { authorization: 'Bearer token' } 
      } as unknown as Request;

      // Act
      await controller.getBasicProtected(req, mockResponse);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 401 when credentials are invalid format', async () => {
      // Arrange
      // Invalid base64 that doesn't decode to username:password
      const req = { 
        headers: { authorization: 'Basic aW52YWxpZA==' } 
      } as unknown as Request;

      // Act
      await controller.getBasicProtected(req, mockResponse);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 401 when auth service throws', async () => {
      // Arrange
      // admin:secret in base64
      const req = { 
        headers: { authorization: 'Basic YWRtaW46c2VjcmV0' } 
      } as unknown as Request;
      
      jest
        .spyOn(authService, 'validateUser')
        .mockRejectedValue(new UnauthorizedException());

      // Act
      await controller.getBasicProtected(req, mockResponse);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="Login Required"'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'secret');
    });

    it('should render page when credentials are valid', async () => {
      // Arrange
      // admin:secret in base64
      const req = { 
        headers: { authorization: 'Basic YWRtaW46c2VjcmV0' } 
      } as unknown as Request;
      
      const user = { userId: 1, username: 'admin' };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      // Act
      await controller.getBasicProtected(req, mockResponse);

      // Assert
      expect(mockResponse.render).toHaveBeenCalledWith('basic-auth', {
        title: 'Basic Auth',
        message: `Hello ${user.username}! This page uses Basic Auth.`,
        user: user,
      });
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'secret');
    });
  });
}); 