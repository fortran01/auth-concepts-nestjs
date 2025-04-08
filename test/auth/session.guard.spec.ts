import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { SessionGuard } from '../../src/auth/session/session.guard';

describe('SessionGuard', () => {
  let guard: SessionGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionGuard],
    }).compile();

    guard = module.get<SessionGuard>(SessionGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if user is authenticated', () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(true),
      };
      
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.isAuthenticated).toHaveBeenCalled();
    });

    it('should return false if user is not authenticated', () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(false),
      };
      
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
      expect(mockRequest.isAuthenticated).toHaveBeenCalled();
    });
  });
}); 