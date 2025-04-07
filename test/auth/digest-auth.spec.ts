import { Test, TestingModule } from '@nestjs/testing';
import { DigestAuthGuard } from '../../src/auth/guards/digest-auth.guard';
import { NonceService } from '../../src/auth/nonce/nonce.service';
import { UsersService } from '../../src/auth/users/users.service';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';

describe('DigestAuthGuard', () => {
  let guard: DigestAuthGuard;
  let nonceService: NonceService;
  let usersService: UsersService;

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn(),
    getResponse: jest.fn(),
  } as unknown as ExecutionContext;

  const mockRequest = {
    headers: {},
    method: 'GET',
    url: '/auth/digest',
  };

  const mockResponse = {
    setHeader: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigestAuthGuard,
        {
          provide: NonceService,
          useFactory: () => ({
            generateNonce: jest.fn().mockReturnValue('test-nonce'),
            isValidNonce: jest.fn().mockReturnValue(true),
          }),
        },
        {
          provide: UsersService,
          useFactory: () => ({
            findOne: jest.fn().mockImplementation((username) => {
              if (username === 'admin') {
                return { userId: 1, username: 'admin', password: 'secret' };
              }
              return null;
            }),
          }),
        },
      ],
    }).compile();

    guard = module.get<DigestAuthGuard>(DigestAuthGuard);
    nonceService = module.get<NonceService>(NonceService);
    usersService = module.get<UsersService>(UsersService);

    // Setup mock context
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);
    (mockExecutionContext.switchToHttp().getResponse as jest.Mock).mockReturnValue(mockResponse);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should send a challenge when no authorization header is present', async () => {
    // Arrange
    mockRequest.headers = {};
    
    // Mock the sendUnauthorizedResponse to stop execution but not throw
    const sendUnauthorizedMock = jest.fn(() => {
      throw new Error('Test controlled error');
    });
    jest.spyOn(guard as any, 'sendUnauthorizedResponse').mockImplementation(sendUnauthorizedMock);
    
    // Mock generateNonce to verify it's called
    const generateNonceSpy = jest.spyOn(nonceService, 'generateNonce');

    // Act & Assert
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Test controlled error');
    expect(sendUnauthorizedMock).toHaveBeenCalled();
  });

  it('should send a challenge when auth header is not digest', async () => {
    // Arrange
    mockRequest.headers = { authorization: 'Basic YWRtaW46c2VjcmV0' };
    
    // Mock the sendUnauthorizedResponse to stop execution but not throw
    const sendUnauthorizedMock = jest.fn(() => {
      throw new Error('Test controlled error');
    });
    jest.spyOn(guard as any, 'sendUnauthorizedResponse').mockImplementation(sendUnauthorizedMock);

    // Act & Assert
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Test controlled error');
    expect(sendUnauthorizedMock).toHaveBeenCalled();
  });

  it('should validate valid digest credentials', async () => {
    // Arrange
    const username = 'admin';
    const password = 'secret';
    const realm = 'Restricted Access';
    const nonce = 'test-nonce';
    const uri = '/auth/digest';
    const method = 'GET';

    // Calculate digest response components
    const ha1 = createHash('md5')
      .update(`${username}:${realm}:${password}`)
      .digest('hex');
      
    const ha2 = createHash('md5')
      .update(`${method}:${uri}`)
      .digest('hex');
      
    const digestResponse = createHash('md5')
      .update(`${ha1}:${nonce}:${ha2}`)
      .digest('hex');

    // Setup mock request with valid digest credentials
    mockRequest.headers = {
      authorization: `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${digestResponse}"`,
    };

    // Act
    let result;
    try {
      result = await guard.canActivate(mockExecutionContext);
    } catch (e) {
      console.log('Exception in test:', e);
      throw e;
    }

    // Assert
    expect(result).toBe(true);
    expect(nonceService.isValidNonce).toHaveBeenCalledWith(nonce);
    expect(usersService.findOne).toHaveBeenCalledWith(username);
  });
}); 