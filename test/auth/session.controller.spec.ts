import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { SessionController } from '../../src/auth/session/session.controller';
import { SessionService } from '../../src/auth/session/session.service';

describe('SessionController', () => {
  let controller: SessionController;
  let sessionService: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionService,
          useFactory: () => ({
            getUser: jest.fn(),
            setupMfa: jest.fn(),
            verifyMfa: jest.fn(),
            verifyWithSecret: jest.fn(),
            enableMfa: jest.fn(),
          }),
        },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
    sessionService = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogin', () => {
    it('should render login view with error messages', () => {
      // Arrange
      const mockRequest = {
        flash: jest.fn().mockImplementation((type) => {
          return type === 'error' ? ['Error message'] : [];
        }),
      };
      
      const mockResponse = {
        render: jest.fn(),
      };

      // Act
      controller.getLogin(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockResponse.render).toHaveBeenCalledWith('login', {
        title: 'Login',
        error: 'Error message',
        flash: {
          success: [],
          info: [],
          error: ['Error message'],
        },
      });
    });

    it('should handle when flash is not available', () => {
      // Arrange
      const mockRequest = {};
      
      const mockResponse = {
        render: jest.fn(),
      };

      // Act
      controller.getLogin(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockResponse.render).toHaveBeenCalledWith('login', {
        title: 'Login',
        error: null,
        flash: {
          success: [],
          info: [],
          error: [],
        },
      });
    });
  });

  describe('postLogin', () => {
    it('should redirect to MFA verification if user has MFA enabled', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
        mfaEnabled: true,
      };
      
      const mockRequest = {
        user: mockUser,
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.postLogin(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockRequest.flash).toHaveBeenCalledWith('info', 'Please verify your identity with MFA');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/verify-mfa');
    });

    it('should redirect to protected page if MFA is not enabled', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
        mfaEnabled: false,
      };
      
      const mockRequest = {
        user: mockUser,
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.postLogin(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockRequest.flash).toHaveBeenCalledWith('success', 'You have successfully logged in!');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/protected');
    });
  });

  describe('getProtected', () => {
    it('should render protected page with user data', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockRequest = {
        user: mockUser,
        flash: jest.fn().mockImplementation((type) => {
          const messages = {
            success: ['Success message'],
            info: ['Info message'],
            error: [],
          };
          return messages[type] || [];
        }),
      };
      
      const mockResponse = {
        render: jest.fn(),
      };

      // Act
      await controller.getProtected(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockResponse.render).toHaveBeenCalledWith('session-auth', {
        title: 'Session Auth',
        message: 'Hello admin! This page uses Session Authentication.',
        user: mockUser,
        flash: {
          success: ['Success message'],
          info: ['Info message'],
          error: [],
        },
      });
    });
  });

  describe('logout', () => {
    it('should call request.logout and redirect', () => {
      // Arrange
      const logoutMock = jest.fn().mockImplementation((cb) => cb());
      
      const mockRequest = {
        logout: logoutMock,
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      controller.logout(mockRequest as any, mockResponse as any);

      // Assert
      expect(logoutMock).toHaveBeenCalled();
      expect(mockRequest.flash).toHaveBeenCalledWith('info', 'You have been logged out');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });

    it('should handle when logout is not available', () => {
      // Arrange
      const mockRequest = {};
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      controller.logout(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('getSetupMfa', () => {
    it('should redirect to login if user is not authenticated', async () => {
      // Arrange
      const mockRequest = {};
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.getSetupMfa(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/login');
    });

    it('should render setup MFA page with secret', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockSession = {};
      
      const mockRequest = {
        user: mockUser,
        session: mockSession,
        flash: jest.fn().mockImplementation((type) => []),
      };
      
      const mockResponse = {
        render: jest.fn(),
      };

      jest.spyOn(sessionService, 'setupMfa').mockResolvedValue('MFA_SECRET');

      // Act
      await controller.getSetupMfa(mockRequest as any, mockResponse as any);

      // Assert
      expect(sessionService.setupMfa).toHaveBeenCalledWith(1);
      expect(mockSession['temp_mfa_secret']).toBe('MFA_SECRET');
      expect(mockResponse.render).toHaveBeenCalledWith('setup-mfa', expect.objectContaining({
        title: 'Setup MFA',
        secret: 'MFA_SECRET',
        flash: {
          success: [],
          info: [],
          error: [],
        }
      }));
    });
  });

  describe('postSetupMfa', () => {
    it('should redirect to login if user is not authenticated', async () => {
      // Arrange
      const mockRequest = {};
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.postSetupMfa(mockRequest as any, mockResponse as any, '123456');

      // Assert
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/login');
    });

    it('should redirect with error if token is missing', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockRequest = {
        user: mockUser,
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.postSetupMfa(mockRequest as any, mockResponse as any, null);

      // Assert
      expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Token is required');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/setup-mfa');
    });

    it('should redirect with error if secret is not in session', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockRequest = {
        user: mockUser,
        session: {},
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.postSetupMfa(mockRequest as any, mockResponse as any, '123456');

      // Assert
      expect(mockRequest.flash).toHaveBeenCalledWith('error', 'MFA setup session expired. Please try again.');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/setup-mfa');
    });

    it('should redirect with error if token verification fails', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockRequest = {
        user: mockUser,
        session: {
          temp_mfa_secret: 'SECRET',
        },
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      jest.spyOn(sessionService, 'verifyWithSecret').mockReturnValue(false);

      // Act
      await controller.postSetupMfa(mockRequest as any, mockResponse as any, '123456');

      // Assert
      expect(sessionService.verifyWithSecret).toHaveBeenCalledWith('123456', 'SECRET');
      expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Invalid token');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/setup-mfa');
    });

    it('should enable MFA and update session if token is valid', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockSession = {
        temp_mfa_secret: 'SECRET',
      };
      
      const mockRequest = {
        user: mockUser,
        session: mockSession,
        flash: jest.fn(),
        logIn: jest.fn().mockImplementation((user, cb) => cb()),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      jest.spyOn(sessionService, 'verifyWithSecret').mockReturnValue(true);
      jest.spyOn(sessionService, 'enableMfa').mockResolvedValue(true);

      // Act
      await controller.postSetupMfa(mockRequest as any, mockResponse as any, '123456');

      // Assert
      expect(sessionService.verifyWithSecret).toHaveBeenCalledWith('123456', 'SECRET');
      expect(sessionService.enableMfa).toHaveBeenCalledWith(1, 'SECRET');
      expect(mockSession.temp_mfa_secret).toBeUndefined();
      expect(mockRequest.logIn).toHaveBeenCalled();
      expect(mockRequest.flash).toHaveBeenCalledWith('success', 'MFA has been successfully set up');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/protected');
    });
  });

  describe('verifyMfa', () => {
    it('should redirect to login if user is not authenticated', async () => {
      // Arrange
      const mockRequest = {};
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.postVerifyMfa(mockRequest as any, mockResponse as any, '123456');

      // Assert
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/login');
    });

    it('should redirect with error if token is missing', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockRequest = {
        user: mockUser,
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      // Act
      await controller.postVerifyMfa(mockRequest as any, mockResponse as any, null);

      // Assert
      expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Token is required');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/verify-mfa');
    });

    it('should redirect with error if token verification fails', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockRequest = {
        user: mockUser,
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      jest.spyOn(sessionService, 'verifyMfa').mockResolvedValue(false);

      // Act
      await controller.postVerifyMfa(mockRequest as any, mockResponse as any, '123456');

      // Assert
      expect(sessionService.verifyMfa).toHaveBeenCalledWith(1, '123456');
      expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Invalid token');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/verify-mfa');
    });

    it('should redirect to protected page if token is valid', async () => {
      // Arrange
      const mockUser = {
        userId: 1,
        username: 'admin',
      };
      
      const mockRequest = {
        user: mockUser,
        flash: jest.fn(),
      };
      
      const mockResponse = {
        redirect: jest.fn(),
      };

      jest.spyOn(sessionService, 'verifyMfa').mockResolvedValue(true);

      // Act
      await controller.postVerifyMfa(mockRequest as any, mockResponse as any, '123456');

      // Assert
      expect(sessionService.verifyMfa).toHaveBeenCalledWith(1, '123456');
      expect(mockRequest.flash).toHaveBeenCalledWith('success', 'MFA verification successful');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth/session/protected');
    });
  });
}); 