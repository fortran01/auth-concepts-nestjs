import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/auth/users/users.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get<UsersService>(UsersService);
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const username = 'nonexistent';
      const password = 'password';
      jest.spyOn(usersService, 'findOne').mockResolvedValue(undefined);

      // Act & Assert
      await expect(authService.validateUser(username, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(username);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      const username = 'admin';
      const password = 'wrongpassword';
      const user = {
        userId: 1,
        username: 'admin',
        password: 'hashedPassword',
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.validateUser(username, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('should return user object without password when credentials are valid', async () => {
      // Arrange
      const username = 'admin';
      const password = 'secret';
      const user = {
        userId: 1,
        username: 'admin',
        password: 'hashedPassword',
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authService.validateUser(username, password);

      // Assert
      expect(result).toEqual({
        userId: user.userId,
        username: user.username,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });
  });
}); 