import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { createBasicAuthHeader, VALID_USER, INVALID_USER } from './helpers';
import * as cheerio from 'cheerio';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

describe('Basic Authentication (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Set up same view engines and static assets as main app
    app.setBaseViewsDir(join(__dirname, '../../src/views'));
    app.setViewEngine('hbs');
    app.useStaticAssets(join(__dirname, '../../src/public'));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Home page', () => {
    it('should be accessible without authentication', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(response => {
          expect(response.text).toContain('Authentication Concepts Demo');
        });
    });
  });

  describe('Basic Auth endpoint', () => {
    it('should require authentication headers', () => {
      return request(app.getHttpServer())
        .get('/auth/basic')
        .expect(401)
        .expect(res => {
          expect(res.headers['www-authenticate']).toBeDefined();
          expect(res.headers['www-authenticate']).toContain('Basic realm="Login Required"');
        });
    });

    it('should reject invalid credentials', () => {
      const { username, password } = INVALID_USER;
      
      return request(app.getHttpServer())
        .get('/auth/basic')
        .set(createBasicAuthHeader(username, password))
        .expect(401)
        .expect(res => {
          expect(res.headers['www-authenticate']).toBeDefined();
          expect(res.headers['www-authenticate']).toContain('Basic realm="Login Required"');
        });
    });

    it('should reject malformed auth header', () => {
      return request(app.getHttpServer())
        .get('/auth/basic')
        .set('Authorization', 'Basic invalid_base64') 
        .expect(401)
        .expect(res => {
          expect(res.headers['www-authenticate']).toBeDefined();
          expect(res.headers['www-authenticate']).toContain('Basic realm="Login Required"');
        });
    });

    it('should accept valid credentials', () => {
      const { username, password } = VALID_USER;
      
      return request(app.getHttpServer())
        .get('/auth/basic')
        .set(createBasicAuthHeader(username, password))
        .expect(200)
        .expect(res => {
          // Parse HTML and check content
          const $ = cheerio.load(res.text);
          expect($('.alert-success').text()).toContain('Authentication Successful');
          expect($('table').text()).toContain(username);
        });
    });

    it('should provide user info after valid authentication', () => {
      const { username, password } = VALID_USER;
      
      return request(app.getHttpServer())
        .get('/auth/basic')
        .set(createBasicAuthHeader(username, password))
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text);
          
          // Check if user ID is displayed
          expect($('table').text()).toContain('User ID');
          expect($('table').text()).toContain('1');
          
          // Check if username is displayed
          expect($('table').text()).toContain('Username');
          expect($('table').text()).toContain(username);
        });
    });
  });
}); 