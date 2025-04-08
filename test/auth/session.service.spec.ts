import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../../src/auth/session/session.service';
import { UsersService } from '../../src/auth/users/users.service';
import { authenticator } from 'otplib';

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(),
    verify: jest.fn(),
  },
}));

describe('SessionService', () => {
  let service: SessionService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: UsersService,
          useFactory: () => ({
            findById: jest.fn(),
            enableMfa: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUser', () => {
    it('should return user without password when user exists', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
        password: 'hashed_password',
      };
      
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await service.getUser(1);

      // Assert
      expect(result).toEqual({
        userId: 1,
        username: 'admin',
      });
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      jest.spyOn(usersService, 'findById').mockResolvedValue(undefined);

      // Act
      const result = await service.getUser(999);

      // Assert
      expect(result).toBeNull();
      expect(usersService.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('setupMfa', () => {
    it('should generate and return MFA secret', async () => {
      // Arrange
      const mockSecret = 'GENERATED_SECRET';
      (authenticator.generateSecret as jest.Mock).mockReturnValue(mockSecret);

      // Act
      const result = await service.setupMfa(1);

      // Assert
      expect(result).toBe(mockSecret);
      expect(authenticator.generateSecret).toHaveBeenCalled();
    });
  });

  describe('verifyMfa', () => {
    it('should return true when MFA is not set up for user', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
        password: 'hashed_password',
      };
      
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await service.verifyMfa(1, '123456');

      // Assert
      expect(result).toBe(true);
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });

    it('should verify token when MFA is set up for user', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
        password: 'hashed_password',
        mfaEnabled: true,
        mfaSecret: 'USER_SECRET',
      };
      
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      (authenticator.verify as jest.Mock).mockReturnValue(true);

      // Act
      const result = await service.verifyMfa(1, '123456');

      // Assert
      expect(result).toBe(true);
      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: '123456',
        secret: 'USER_SECRET',
      });
    });

    it('should return false when verification fails', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
        password: 'hashed_password',
        mfaEnabled: true,
        mfaSecret: 'USER_SECRET',
      };
      
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      // Act
      const result = await service.verifyMfa(1, 'invalid');

      // Assert
      expect(result).toBe(false);
      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: 'invalid',
        secret: 'USER_SECRET',
      });
    });

    it('should handle verification errors', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
        password: 'hashed_password',
        mfaEnabled: true,
        mfaSecret: 'USER_SECRET',
      };
      
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      (authenticator.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Verification error');
      });
      
      // Mock console.error to avoid cluttering test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await service.verifyMfa(1, 'error');

      // Assert
      expect(result).toBe(false);
      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('verifyWithSecret', () => {
    it('should return false if token or secret is missing', () => {
      // Act & Assert
      expect(service.verifyWithSecret('', 'secret')).toBe(false);
      expect(service.verifyWithSecret('token', '')).toBe(false);
      expect(service.verifyWithSecret('', '')).toBe(false);
      expect(service.verifyWithSecret(null, 'secret')).toBe(false);
      expect(service.verifyWithSecret('token', null)).toBe(false);
    });

    it('should verify token with provided secret', () => {
      // Arrange
      (authenticator.verify as jest.Mock).mockReturnValue(true);

      // Act
      const result = service.verifyWithSecret('123456', 'TEST_SECRET');

      // Assert
      expect(result).toBe(true);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: '123456',
        secret: 'TEST_SECRET',
      });
    });

    it('should handle verification errors', () => {
      // Arrange
      (authenticator.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Verification error');
      });
      
      // Mock console.error to avoid cluttering test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = service.verifyWithSecret('error', 'TEST_SECRET');

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('enableMfa', () => {
    it('should forward to usersService.enableMfa', async () => {
      // Arrange
      jest.spyOn(usersService, 'enableMfa').mockResolvedValue(true);

      // Act
      const result = await service.enableMfa(1, 'SECRET');

      // Assert
      expect(result).toBe(true);
      expect(usersService.enableMfa).toHaveBeenCalledWith(1, 'SECRET');
    });
  });
}); 