import { Test, TestingModule } from '@nestjs/testing';
import { SessionSerializer } from '../../src/auth/session/session.serializer';
import { User } from '../../src/auth/users/users.service';

describe('SessionSerializer', () => {
  let serializer: SessionSerializer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionSerializer],
    }).compile();

    serializer = module.get<SessionSerializer>(SessionSerializer);
  });

  it('should be defined', () => {
    expect(serializer).toBeDefined();
  });

  describe('serializeUser', () => {
    it('should serialize user to userId and username', () => {
      // Arrange
      const mockUser: User = {
        userId: 1,
        username: 'admin',
        password: 'hashed_password',
        mfaEnabled: false,
      };
      
      const doneMock = jest.fn();

      // Act
      serializer.serializeUser(mockUser, doneMock);

      // Assert
      expect(doneMock).toHaveBeenCalledWith(null, {
        userId: 1,
        username: 'admin',
      });
    });
  });

  describe('deserializeUser', () => {
    it('should return the payload as is', () => {
      // Arrange
      const mockPayload = {
        userId: 1,
        username: 'admin',
      };
      
      const doneMock = jest.fn();

      // Act
      serializer.deserializeUser(mockPayload, doneMock);

      // Assert
      expect(doneMock).toHaveBeenCalledWith(null, mockPayload);
    });
  });
}); 