import { Test, TestingModule } from '@nestjs/testing';
import { Auth0ApiController } from '../../src/auth/auth0/auth0-api.controller';
import { Auth0JwtPayload } from '../../src/auth/auth0/interfaces/auth0-jwt-payload.interface';

describe('Auth0ApiController', () => {
  let controller: Auth0ApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Auth0ApiController],
    }).compile();

    controller = module.get<Auth0ApiController>(Auth0ApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPublicResource', () => {
    it('should return public data', () => {
      const result = controller.getPublicResource();
      expect(result.message).toEqual('This is a public API endpoint that anyone can access');
      expect(result.data).toBeDefined();
    });
  });

  describe('getProtectedResource', () => {
    it('should return protected data with user information', () => {
      const mockUser: Auth0JwtPayload = {
        sub: 'auth0|123456',
        scope: 'read:data',
        permissions: ['read:data'],
      };
      
      const mockRequest = {
        user: mockUser,
      };
      
      const result = controller.getProtectedResource(mockRequest as any);
      
      expect(result.message).toEqual('You have accessed a protected API endpoint');
      expect(result.data).toBeDefined();
      expect(result.data.protectedInfo).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.sub).toEqual(mockUser.sub);
      expect(result.user.permissions).toEqual(mockUser.permissions);
    });
  });

  describe('createData', () => {
    it('should create data and return response with user information', () => {
      const mockUser: Auth0JwtPayload = {
        sub: 'auth0|123456',
      };
      
      const mockRequest = {
        user: mockUser,
      };
      
      const mockData = { name: 'Test Data', value: 42 };
      
      const result = controller.createData(mockData, mockRequest as any);
      
      expect(result.message).toEqual('Data successfully created');
      expect(result.data).toBeDefined();
      expect(result.data.received).toEqual(mockData);
      expect(result.data.created).toBeTruthy();
      expect(result.user).toBeDefined();
      expect(result.user.sub).toEqual(mockUser.sub);
    });
  });
}); 