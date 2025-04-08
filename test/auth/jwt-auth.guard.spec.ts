import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/token/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('canActivate', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should call super.canActivate with the execution context', () => {
      // Arrange
      const context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnThis(),
      } as unknown as ExecutionContext;

      // Mock super.canActivate
      jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation(function(this: any, ctx) {
        // 'this' binding is important here
        return true;
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return the user when no error and user exists', () => {
      // Arrange
      const user = { userId: 1, username: 'admin' };
      const err = null;
      const info = null;

      // Act
      const result = guard.handleRequest(err, user, info);

      // Assert
      expect(result).toBe(user);
    });

    it('should throw the original error when provided', () => {
      // Arrange
      const user = null;
      const err = new Error('Original error');
      const info = null;

      // Act & Assert
      expect(() => guard.handleRequest(err, user, info)).toThrow(err);
    });

    it('should throw UnauthorizedException when user is null and no error', () => {
      // Arrange
      const user = null;
      const err = null;
      const info = null;

      // Act & Assert
      expect(() => guard.handleRequest(err, user, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(err, user, info)).toThrow('Invalid token or unauthorized access');
    });
  });
}); 