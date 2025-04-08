import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { join } from 'path';
import { AppModule } from '../../src/app.module';
import { VALID_USER } from './helpers';

describe('Token Authentication (e2e)', () => {
  let app: NestExpressApplication;
  let server: any;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Setup template engine
    app.setViewEngine('hbs');
    app.setBaseViewsDir(join(__dirname, '../../src/views'));
    
    // Setup validation pipe
    app.useGlobalPipes(new ValidationPipe());
    
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /token/login', () => {
    it('should render login page', async () => {
      // Act
      const response = await request(server)
        .get('/token/login')
        .expect(200);
      
      // Assert
      expect(response.text).toContain('Token-based Login');
    });
  });

  describe('POST /token/login', () => {
    it('should return JWT token with valid credentials', async () => {
      // Act
      const response = await request(server)
        .post('/token/login')
        .send({
          username: VALID_USER.username,
          password: VALID_USER.password,
        })
        .expect(201);
      
      // Assert
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('expires_in', 3600);
      expect(response.body).toHaveProperty('token_type', 'Bearer');
      
      // Store token for later tests
      jwtToken = response.body.access_token;
      
      // Verify token structure
      const decodedToken = jwt.decode(jwtToken);
      expect(decodedToken).toHaveProperty('sub');
      expect(decodedToken).toHaveProperty('username', VALID_USER.username);
      expect(decodedToken).toHaveProperty('iat'); // issued at
      expect(decodedToken).toHaveProperty('exp'); // expiration
    });

    it('should return 401 with invalid credentials', async () => {
      // Act
      await request(server)
        .post('/token/login')
        .send({
          username: 'invalid',
          password: 'invalid',
        })
        .expect(401);
    });
  });

  describe('GET /token/protected', () => {
    it('should return unauthorized error message when accessing with invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid.token.string';
      
      // Act
      const response = await request(server)
        .get('/token/protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(200); // Note: Returns 200 with error message in HTML
      
      // Assert
      expect(response.text).toContain('Invalid or expired token');
    });

    it('should return protected page content with valid token', async () => {
      // Act
      const response = await request(server)
        .get('/token/protected')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      
      // Assert
      expect(response.text).toContain(`Hello ${VALID_USER.username}!`);
      expect(response.text).toContain('protected by JWT token authentication');
    });

    it('should render the login form if no token is provided', async () => {
      // Act
      const response = await request(server)
        .get('/token/protected')
        .expect(200);
      
      // Assert
      expect(response.text).toContain('protected by JWT token authentication');
      expect(response.text).not.toContain(`Hello ${VALID_USER.username}!`);
    });
  });

  describe('GET /token/data', () => {
    it('should return 401 unauthorized when accessing without token', async () => {
      // Act
      await request(server)
        .get('/token/data')
        .expect(401);
    });

    it('should return 401 unauthorized with invalid token', async () => {
      // Act
      await request(server)
        .get('/token/data')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);
    });

    it('should return user data with valid token', async () => {
      // Act
      const response = await request(server)
        .get('/token/data')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      
      // Assert
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('userId');
      expect(response.body.user).toHaveProperty('username', VALID_USER.username);
      expect(response.body).toHaveProperty('timestamp');
    });
  });
}); 