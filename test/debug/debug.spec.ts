import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import * as passport from 'passport';
import { join } from 'path';
import { AppModule } from '../../src/app.module';

describe('Debug Controller (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Setup template engine
    app.setViewEngine('hbs');
    app.setBaseViewsDir(join(__dirname, '../../src/views'));
    
    // Set up cookie-parser
    app.use(cookieParser());
    
    // Set up session middleware for testing
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );
    
    // Setup passport middleware
    app.use(passport.initialize());
    app.use(passport.session());
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/debug/redis-session (GET) - should return session data', async () => {
    // Create a session by setting a value
    const agent = request.agent(app.getHttpServer());
    
    // Login using session first
    await agent
      .get('/auth/session/login')
      .expect(200);
    
    // Now make request to the debug endpoint
    return agent
      .get('/debug/redis-session')
      .expect(200)
      .expect((res) => {
        // We just check if the response has the expected structure
        expect(res.body).toHaveProperty('all_sessions');
        expect(res.body).toHaveProperty('current_session');
        expect(res.body).toHaveProperty('session_keys');
      });
  });
}); 