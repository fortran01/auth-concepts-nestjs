import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

describe('Debug Controller (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
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
      .get('/auth/session/login') // Assuming this route exists
      .expect(200);
    
    // Now make request to the debug endpoint
    return agent
      .get('/debug/redis-session')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('current_session_id');
        expect(res.body).toHaveProperty('all_sessions');
        expect(res.body).toHaveProperty('current_session');
      });
  });
}); 