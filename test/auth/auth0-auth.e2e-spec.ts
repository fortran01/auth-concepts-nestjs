import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import * as session from 'express-session';
import * as passport from 'passport';
import * as hbs from 'hbs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth0 Authentication (e2e)', () => {
  let app: NestExpressApplication;
  let server: any;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(ConfigService)
    .useValue({
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'AUTH0_DOMAIN':
            return 'test-domain.auth0.com';
          case 'AUTH0_CLIENT_ID':
            return 'test-client-id';
          case 'AUTH0_CLIENT_SECRET':
            return 'test-client-secret';
          case 'AUTH0_CALLBACK_URL':
            return 'http://localhost:3000/auth0/callback';
          case 'AUTH0_LOGOUT_URL':
            return 'http://localhost:3000';
          case 'SESSION_SECRET':
            return 'test-session-secret';
          default:
            return undefined;
        }
      }),
    })
    .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Setup template engine
    app.setViewEngine('hbs');
    app.setBaseViewsDir(join(__dirname, '../../src/views'));
    
    // Register Handlebars helpers
    hbs.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });
    
    // Setup validation pipe
    app.useGlobalPipes(new ValidationPipe());
    
    // Setup session middleware
    app.use(
      session({
        secret: 'test-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      }),
    );
    
    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Add flash message support
    app.use((req: any, res: any, next: any) => {
      // Initialize flash if not already set
      if (!req.session) {
        req.session = {};
      }
      
      if (!req.session.flash) {
        req.session.flash = {};
      }
      
      // Define the flash function
      req.flash = function(type: string, message?: string) {
        if (!req.session.flash) {
          req.session.flash = {};
        }
        
        if (!req.session.flash[type]) {
          req.session.flash[type] = [];
        }
        
        // Handle the case where flash is called to retrieve messages
        if (message === undefined) {
          const messages = req.session.flash[type] || [];
          req.session.flash[type] = []; // Clear after reading
          return messages;
        }
        
        // Otherwise, add the message
        req.session.flash[type].push(message);
        return req.session.flash[type];
      };
      
      // Make flash messages available to views
      res.locals.flash = req.session.flash;
      
      next();
    });
    
    configService = app.get<ConfigService>(ConfigService);
    
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth0/login', () => {
    it('should redirect to Auth0 login page', async () => {
      // Act
      const response = await request(server)
        .get('/auth0/login')
        .expect(302);
      
      // Assert
      expect(response.headers.location).toContain('https://test-domain.auth0.com/authorize');
      expect(response.headers.location).toContain('client_id=test-client-id');
      expect(response.headers.location).toContain('redirect_uri=http://localhost:3000/auth0/callback');
      expect(response.headers.location).toContain('response_type=code');
      expect(response.headers.location).toContain('scope=openid%20profile%20email');
    });
  });

  describe('GET /auth0/callback', () => {
    it('should exchange code for tokens and redirect to profile on success', async () => {
      // Arrange
      const mockCode = 'test-code';
      const mockTokenResponse = {
        access_token: 'test-access-token',
        id_token: 'test-id-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      const mockUserProfile = {
        sub: 'auth0|123456',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: mockUserProfile });

      // Act
      const response = await request(server)
        .get(`/auth0/callback?code=${mockCode}`)
        .expect(302);
      
      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-domain.auth0.com/oauth/token',
        expect.objectContaining({
          code: mockCode,
        }),
        expect.any(Object),
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-domain.auth0.com/userinfo',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockTokenResponse.access_token}`,
          }),
        }),
      );
      expect(response.headers.location).toBe('/auth0/profile');
    });

    it('should redirect to home when code is missing', async () => {
      // Act
      const response = await request(server)
        .get('/auth0/callback')
        .expect(302);
      
      // Assert
      expect(response.headers.location).toBe('/');
    });

    it('should redirect to error page when token exchange fails', async () => {
      // Arrange
      const mockCode = 'invalid-code';
      mockedAxios.post.mockRejectedValueOnce(new Error('Token exchange failed'));

      // Act
      const response = await request(server)
        .get(`/auth0/callback?code=${mockCode}`)
        .expect(302);
      
      // Assert
      expect(response.headers.location).toBe('/?error=authentication_failed');
    });
  });

  describe('GET /auth0/profile', () => {
    it('should redirect to login when user is not authenticated', async () => {
      // Act
      const response = await request(server)
        .get('/auth0/profile')
        .expect(302);
      
      // Assert
      expect(response.headers.location).toBe('/auth0/login');
    });

    it('should render profile page when user is authenticated', async () => {
      // This test requires a session with authenticated user
      // We'll use a custom agent to maintain session across requests
      const agent = request.agent(server);
      
      // Mock user session data by directly manipulating the session
      const mockUser = {
        sub: 'auth0|123456',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/picture.jpg',
      };
      
      // First authenticate through callback with mocked services
      const mockCode = 'test-code';
      const mockTokenResponse = {
        access_token: 'test-access-token',
        id_token: 'test-id-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      
      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: mockUser });
      
      // Authenticate first
      await agent
        .get(`/auth0/callback?code=${mockCode}`)
        .expect(302);
      
      // Then access profile
      const response = await agent
        .get('/auth0/profile')
        .expect(200);
      
      // Assert profile page content
      expect(response.text).toContain('Auth0 Profile');
      expect(response.text).toContain(mockUser.name);
      expect(response.text).toContain(mockUser.email);
    });
  });

  describe('GET /auth0/logout', () => {
    it('should clear session and redirect to Auth0 logout', async () => {
      // This test requires a session with authenticated user
      const agent = request.agent(server);
      
      // Mock user session data by directly manipulating the session
      const mockUser = {
        sub: 'auth0|123456',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/picture.jpg',
      };
      
      // First authenticate through callback with mocked services
      const mockCode = 'test-code';
      const mockTokenResponse = {
        access_token: 'test-access-token',
        id_token: 'test-id-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      
      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: mockUser });
      
      // Authenticate first
      await agent
        .get(`/auth0/callback?code=${mockCode}`)
        .expect(302);
      
      // Then logout
      const response = await agent
        .get('/auth0/logout')
        .expect(302);
      
      // Assert logout redirect
      expect(response.headers.location).toContain('https://test-domain.auth0.com/v2/logout');
      expect(response.headers.location).toContain('client_id=test-client-id');
      expect(response.headers.location).toContain('returnTo=');
      
      // Verify profile is no longer accessible
      await agent
        .get('/auth0/profile')
        .expect(302)
        .expect('Location', '/auth0/login');
    });
  });
}); 