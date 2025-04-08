import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cheerio from 'cheerio';
import { join } from 'path';
import { AppModule } from '../../src/app.module';
import { VALID_USER } from './helpers';

describe('Session Authentication (e2e)', () => {
  let app: NestExpressApplication;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Setup template engine
    app.setViewEngine('hbs');
    app.setBaseViewsDir(join(__dirname, '../../src/views'));
    
    // Setup session middleware
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 60000,
        },
      }),
    );
    
    // Setup passport middleware
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Setup validation pipe
    app.useGlobalPipes(new ValidationPipe());
    
    await app.init();
    
    // Create an agent to maintain session cookies
    agent = request.agent(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /auth/session/login', () => {
    it('should render login form', async () => {
      // Act
      await agent.get('/auth/session/login')
        .expect(200);
      
      // We don't check the page content as it may vary
    });
  });

  describe('POST /auth/session/login', () => {
    it('should redirect to protected page with valid credentials', async () => {
      // Act
      const response = await agent
        .post('/auth/session/login')
        .type('form')
        .send({
          username: VALID_USER.username,
          password: VALID_USER.password,
        })
        .expect(302);
      
      // Assert
      expect(response.headers.location).toBe('/auth/session/protected');
    });

    it('should return 401 with invalid credentials', async () => {
      // Act
      await agent
        .post('/auth/session/login')
        .type('form')
        .send({
          username: 'invalid',
          password: 'invalid',
        })
        .expect(401); // NestJS returns 401 for unauthorized access by default
    });
  });

  describe('GET /auth/session/protected', () => {
    it('should return 403 when not authenticated', async () => {
      // Act
      await agent
        .get('/auth/session/protected')
        .expect(403); // Guard will return 403 Forbidden by default
    });

    it('should return 200 when authenticated', async () => {
      // Arrange - Login first
      await agent
        .post('/auth/session/login')
        .type('form')
        .send({
          username: VALID_USER.username,
          password: VALID_USER.password,
        })
        .expect(302);
      
      // Act
      await agent
        .get('/auth/session/protected')
        .expect(200);
      
      // We don't check the page content as it may vary
    });
  });

  describe('GET /auth/session/logout', () => {
    it('should logout and redirect to home page', async () => {
      // Arrange - Login first
      await agent
        .post('/auth/session/login')
        .type('form')
        .send({
          username: VALID_USER.username,
          password: VALID_USER.password,
        })
        .expect(302);
      
      // Verify logged in
      await agent
        .get('/auth/session/protected')
        .expect(200);
      
      // Act - Logout
      const response = await agent
        .get('/auth/session/logout')
        .expect(302);
      
      // Assert
      expect(response.headers.location).toBe('/');
      
      // Verify no longer authenticated
      await agent
        .get('/auth/session/protected')
        .expect(403); // Will get 403 Forbidden after logout
    });
  });

  describe('MFA Setup Flow', () => {
    it('should return 403 when accessing setup-mfa page while not authenticated', async () => {
      // Act
      await agent
        .get('/auth/session/setup-mfa')
        .expect(403); // Will get 403 Forbidden when not authenticated
    });

    it('should return 200 when accessing setup-mfa page while authenticated', async () => {
      // Arrange - Login first
      await agent
        .post('/auth/session/login')
        .type('form')
        .send({
          username: VALID_USER.username,
          password: VALID_USER.password,
        })
        .expect(302);
      
      // Act
      await agent
        .get('/auth/session/setup-mfa')
        .expect(200);
      
      // We don't check the page content as it may vary
    });
  });
}); 