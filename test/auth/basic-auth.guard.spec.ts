import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { BasicAuthGuard } from '../../src/auth/guards/basic-auth.guard';
import { AuthService } from '../../src/auth/auth.service';

describe('BasicAuthGuard', () => {
  let guard: BasicAuthGuard;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasicAuthGuard,
        {
          provide: AuthService,
          useFactory: () => ({
            validateUser: jest.fn(),
          }),
        },
      ],
    }).compile();

    guard = module.get<BasicAuthGuard>(BasicAuthGuard);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException if no authorization header', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).rejects.toThrow(
        'Missing or invalid authorization header',
      );
    });

    it('should throw UnauthorizedException if not Basic auth', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer token',
            },
          }),
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).rejects.toThrow(
        'Missing or invalid authorization header',
      );
    });

    it('should throw UnauthorizedException if credentials are invalid format', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic invalidformat',
            },
          }),
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).rejects.toThrow(
        'Invalid credentials format',
      );
    });

    it('should throw UnauthorizedException if auth service throws', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              // admin:secret in base64
              authorization: 'Basic YWRtaW46c2VjcmV0',
            },
          }),
        }),
      } as ExecutionContext;

      jest
        .spyOn(authService, 'validateUser')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'secret');
    });

    it('should return true and set user if credentials are valid', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          // admin:secret in base64
          authorization: 'Basic YWRtaW46c2VjcmV0',
        },
        user: undefined,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const user = { userId: 1, username: 'admin' };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(user);
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'secret');
    });
  });
}); 