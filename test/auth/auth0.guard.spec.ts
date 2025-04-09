import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Auth0Guard } from '../../src/auth/auth0/auth0.guard';

describe('Auth0Guard', () => {
  let guard: Auth0Guard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Auth0Guard],
    }).compile();

    guard = module.get<Auth0Guard>(Auth0Guard);
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated in session', () => {
      // Arrange
      const mockUser = { sub: 'auth0|123', name: 'Test User' };
      const mockRequest = {
        session: {
          auth0User: mockUser,
        },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated in session', () => {
      // Arrange
      const mockRequest = {
        session: {},
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when session is undefined', () => {
      // Arrange
      const mockRequest = {};

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });
  });
}); 