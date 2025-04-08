import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cheerio from 'cheerio';
import { NestExpressApplication } from '@nestjs/platform-express';

describe('CSRF Demo (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Set up session middleware for testing
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 },
      }),
    );
    
    // Set up Passport.js
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Setup template engine
    app.setBaseViewsDir('src/views');
    app.setViewEngine('hbs');
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /csrf-demo - should render the CSRF demo page', async () => {
    const response = await request(app.getHttpServer())
      .get('/csrf-demo')
      .expect(200);
      
    expect(response.text).toContain('Cross-Site Request Forgery (CSRF) Demo');
    expect(response.text).toContain('Vulnerable Page');
    expect(response.text).toContain('Protected Page');
  });

  it('GET /csrf-demo/profile - should render the vulnerable profile page', async () => {
    const response = await request(app.getHttpServer())
      .get('/csrf-demo/profile')
      .expect(200);
      
    expect(response.text).toContain('User Profile (Vulnerable to CSRF)');
    expect(response.text).toContain('Update Email Address');
    expect(response.text).toContain('user@example.com'); // Default email
  });

  it('POST /csrf-demo/update-email - should update the email address', async () => {
    // Establish a session by visiting the profile page first
    const agent = request.agent(app.getHttpServer());
    await agent.get('/csrf-demo/profile');
    
    // Now update the email
    const response = await agent
      .post('/csrf-demo/update-email')
      .send('email=new@example.com')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .expect(302); // Redirect
      
    // Follow the redirect
    const redirectRes = await agent
      .get('/csrf-demo/profile')
      .expect(200);
      
    expect(redirectRes.text).toContain('new@example.com');
    expect(redirectRes.text).toContain('Email updated successfully!');
  });

  it('GET /csrf-demo/profile-protected - should render the protected profile page with CSRF token', async () => {
    const response = await request(app.getHttpServer())
      .get('/csrf-demo/profile-protected')
      .expect(200);
      
    expect(response.text).toContain('User Profile (Protected from CSRF)');
    expect(response.text).toContain('Update Email Address');
    expect(response.text).toContain('user@example.com'); // Default email
    
    // Extract the CSRF token
    const $ = cheerio.load(response.text);
    const csrfToken = $('input[name="csrf_token"]').val();
    expect(csrfToken).toBeDefined();
    expect(csrfToken.length).toBeGreaterThan(10); // Should be a long token
  });

  it('POST /csrf-demo/update-email-protected - should fail without CSRF token', async () => {
    // Establish a session by visiting the profile page first
    const agent = request.agent(app.getHttpServer());
    await agent.get('/csrf-demo/profile-protected');
    
    // Try to update the email without a token
    const response = await agent
      .post('/csrf-demo/update-email-protected')
      .send('email=hacked@example.com')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .expect(302); // Redirect
      
    // Follow the redirect
    const redirectRes = await agent
      .get('/csrf-demo/profile-protected')
      .expect(200);
      
    // Should still show the old email
    expect(redirectRes.text).toContain('user@example.com');
    expect(redirectRes.text).toContain('Invalid CSRF token');
  });

  it('POST /csrf-demo/update-email-protected - should succeed with valid CSRF token', async () => {
    // Establish a session by visiting the protected profile page
    const agent = request.agent(app.getHttpServer());
    const firstRes = await agent.get('/csrf-demo/profile-protected');
    
    // Extract the CSRF token
    const $ = cheerio.load(firstRes.text);
    const csrfToken = $('input[name="csrf_token"]').val();
    
    // Now update the email with the token
    const response = await agent
      .post('/csrf-demo/update-email-protected')
      .send(`email=valid@example.com&csrf_token=${csrfToken}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .expect(302); // Redirect
      
    // Follow the redirect
    const redirectRes = await agent
      .get('/csrf-demo/profile-protected')
      .expect(200);
      
    expect(redirectRes.text).toContain('valid@example.com');
    expect(redirectRes.text).toContain('Email updated successfully!');
  });
});
