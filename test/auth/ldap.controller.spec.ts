import { Test, TestingModule } from '@nestjs/testing';
import { LdapController } from '../../src/auth/ldap/ldap.controller';
import { LdapService } from '../../src/auth/ldap/ldap.service';
import { Logger } from '@nestjs/common';
import { LdapUser } from '../../src/auth/ldap/ldap.service';

describe('LdapController', () => {
  let controller: LdapController;
  let ldapService: LdapService;

  const mockResponse = () => {
    const res = {} as any;
    res.render = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LdapController],
      providers: [
        {
          provide: LdapService,
          useValue: {
            testConnection: jest.fn(),
            authenticate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LdapController>(LdapController);
    ldapService = module.get<LdapService>(LdapService);
    
    // Mock logger to prevent console spam during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLdapLoginPage', () => {
    it('should render the LDAP login page', async () => {
      // Arrange
      const req = { query: {} } as any;
      const res = mockResponse();

      // Act
      await controller.getLdapLoginPage(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('ldap-login', {
        title: 'LDAP Authentication',
        message: 'Please log in with your LDAP credentials',
        error: undefined,
        success: undefined,
      });
    });

    it('should pass error message to template when provided in query params', async () => {
      // Arrange
      const req = { query: { error: 'Invalid credentials' } } as any;
      const res = mockResponse();

      // Act
      await controller.getLdapLoginPage(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('ldap-login', {
        title: 'LDAP Authentication',
        message: 'Please log in with your LDAP credentials',
        error: 'Invalid credentials',
        success: undefined,
      });
    });

    it('should pass success message to template when provided in query params', async () => {
      // Arrange
      const req = { query: { success: 'Logged out successfully' } } as any;
      const res = mockResponse();

      // Act
      await controller.getLdapLoginPage(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('ldap-login', {
        title: 'LDAP Authentication',
        message: 'Please log in with your LDAP credentials',
        error: undefined,
        success: 'Logged out successfully',
      });
    });
  });

  describe('testLdapConnection', () => {
    it('should return success response when LDAP connection works', async () => {
      // Arrange
      const res = mockResponse();
      jest.spyOn(ldapService, 'testConnection').mockResolvedValue({
        success: true,
        message: 'LDAP connection successful',
      });

      // Act
      await controller.testLdapConnection(res);

      // Assert
      expect(ldapService.testConnection).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'LDAP connection successful',
      });
    });

    it('should return error response when LDAP connection fails', async () => {
      // Arrange
      const res = mockResponse();
      jest.spyOn(ldapService, 'testConnection').mockResolvedValue({
        success: false,
        message: 'LDAP connection failed',
      });

      // Act
      await controller.testLdapConnection(res);

      // Assert
      expect(ldapService.testConnection).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'LDAP connection failed',
      });
    });

    it('should handle exceptions during connection test', async () => {
      // Arrange
      const res = mockResponse();
      jest.spyOn(ldapService, 'testConnection').mockRejectedValue(new Error('Test error'));

      // Act
      await controller.testLdapConnection(res);

      // Assert
      expect(ldapService.testConnection).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'LDAP connection test failed',
        error: 'Test error',
      });
    });
  });

  describe('logout', () => {
    it('should redirect to login page with success message', async () => {
      // Arrange
      const req = {} as any;
      const res = mockResponse();

      // Act
      await controller.logout(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        '/auth/ldap?success=You+have+been+successfully+logged+out'
      );
    });
  });

  describe('ldapLogin', () => {
    it('should redirect to login page with error when username or password is missing', async () => {
      // Arrange
      const loginDto = { username: '', password: '' };
      const res = mockResponse();

      // Act
      await controller.ldapLogin(loginDto, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/auth/ldap?error=Username+and+password+are+required');
    });

    it('should redirect to login page with error when LDAP connection test fails', async () => {
      // Arrange
      const loginDto = { username: 'john.doe', password: 'password123' };
      const res = mockResponse();
      
      jest.spyOn(ldapService, 'testConnection').mockResolvedValue({
        success: false,
        message: 'LDAP server unreachable',
      });

      // Act
      await controller.ldapLogin(loginDto, res);

      // Assert
      expect(ldapService.testConnection).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/auth/ldap?error=LDAP+server+connection+failed');
    });

    it('should redirect to login page with error when authentication fails', async () => {
      // Arrange
      const loginDto = { username: 'john.doe', password: 'wrong_password' };
      const res = mockResponse();
      
      jest.spyOn(ldapService, 'testConnection').mockResolvedValue({
        success: true,
        message: 'LDAP connection successful',
      });
      
      jest.spyOn(ldapService, 'authenticate').mockResolvedValue(null);

      // Act
      await controller.ldapLogin(loginDto, res);

      // Assert
      expect(ldapService.testConnection).toHaveBeenCalled();
      expect(ldapService.authenticate).toHaveBeenCalledWith('john.doe', 'wrong_password');
      expect(res.redirect).toHaveBeenCalledWith('/auth/ldap?error=Invalid+username+or+password');
    });

    it('should render the protected page when authentication succeeds', async () => {
      // Arrange
      const loginDto = { username: 'john.doe', password: 'password123' };
      const res = mockResponse();
      
      jest.spyOn(ldapService, 'testConnection').mockResolvedValue({
        success: true,
        message: 'LDAP connection successful',
      });
      
      const mockUser: LdapUser = {
        dn: 'uid=john.doe,ou=People,dc=example,dc=org',
        uid: 'john.doe',
        cn: 'John Doe',
        sn: 'Doe',
        givenName: 'John',
        mail: 'john.doe@example.org',
        title: 'Software Engineer',
      };
      
      jest.spyOn(ldapService, 'authenticate').mockResolvedValue(mockUser);

      // Act
      await controller.ldapLogin(loginDto, res);

      // Assert
      expect(ldapService.testConnection).toHaveBeenCalled();
      expect(ldapService.authenticate).toHaveBeenCalledWith('john.doe', 'password123');
      expect(res.render).toHaveBeenCalledWith('ldap-protected', {
        title: 'LDAP Authentication Successful',
        message: 'Welcome, John Doe!',
        user: mockUser,
      });
    });

    it('should use fallback user data for test users when fields are missing', async () => {
      // Arrange
      const loginDto = { username: 'john.doe', password: 'password123' };
      const res = mockResponse();
      
      jest.spyOn(ldapService, 'testConnection').mockResolvedValue({
        success: true,
        message: 'LDAP connection successful',
      });
      
      // Return user with minimal data (missing fields)
      const mockUser: LdapUser = {
        dn: 'uid=john.doe,ou=People,dc=example,dc=org',
        uid: 'john.doe',
        cn: '',
        sn: '',
        givenName: '',
        mail: '',
      };
      
      jest.spyOn(ldapService, 'authenticate').mockResolvedValue(mockUser);

      // Act
      await controller.ldapLogin(loginDto, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('ldap-protected', {
        title: 'LDAP Authentication Successful',
        message: 'Welcome, John Doe!',
        user: expect.objectContaining({
          cn: 'John Doe',
          sn: 'Doe',
          givenName: 'John',
          mail: 'john.doe@example.org',
          title: 'Software Engineer',
        }),
      });
    });

    it('should handle exceptions during authentication', async () => {
      // Arrange
      const loginDto = { username: 'john.doe', password: 'password123' };
      const res = mockResponse();
      
      jest.spyOn(ldapService, 'testConnection').mockResolvedValue({
        success: true,
        message: 'LDAP connection successful',
      });
      
      jest.spyOn(ldapService, 'authenticate').mockRejectedValue(new Error('Authentication error'));

      // Act
      await controller.ldapLogin(loginDto, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/auth/ldap?error=Authentication+failed');
    });
  });
}); 