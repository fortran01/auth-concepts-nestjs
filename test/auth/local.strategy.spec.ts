import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from '../../src/auth/session/local.strategy';
import { AuthService } from '../../src/auth/auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useFactory: () => ({
            validateUser: jest.fn(),
          }),
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user if credentials are valid', async () => {
      // Arrange
      const user = { userId: 1, username: 'admin' };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      // Act
      const result = await strategy.validate('admin', 'secret');

      // Assert
      expect(result).toEqual(user);
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'secret');
    });

    it('should throw UnauthorizedException if AuthService throws', async () => {
      // Arrange
      jest
        .spyOn(authService, 'validateUser')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(strategy.validate('admin', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith('admin', 'wrong');
    });
  });
}); 