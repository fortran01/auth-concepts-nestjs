import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, JwtPayload } from '../../src/auth/token/jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useFactory: () => ({
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'test-jwt-secret';
              return null;
            }),
          }),
        },
      ],
    }).compile();

    jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(jwtStrategy).toBeDefined();
    });

    it('should get JWT_SECRET from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should return user object from JWT payload', async () => {
      // Arrange
      const payload: JwtPayload = {
        sub: 1,
        username: 'admin',
        iat: 1630000000,
        exp: 1630003600,
      };

      // Act
      const result = await jwtStrategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: payload.sub,
        username: payload.username,
      });
    });
  });
}); 