import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('CORS API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/data (OPTIONS) - preflight request should have no CORS headers', () => {
    return request(app.getHttpServer())
      .options('/api/data')
      .expect(204)
      .expect((res) => {
        // No CORS headers should be present
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
        expect(res.headers['access-control-allow-methods']).toBeUndefined();
        expect(res.headers['access-control-allow-headers']).toBeUndefined();
      });
  });

  it('/api/data (GET) - returns data correctly without CORS headers', () => {
    return request(app.getHttpServer())
      .get('/api/data')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('This is data from the API server');
        expect(res.body.status).toBe('success');
        expect(res.body.data).toEqual([1, 2, 3, 4, 5]);
        // No CORS headers should be present
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
      });
  });

  it('/api/data-with-cors (GET) - includes CORS headers for all origins', () => {
    return request(app.getHttpServer())
      .get('/api/data-with-cors')
      .expect(200)
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBe('*');
        expect(res.body.message).toBe('This is data from the API server (with CORS enabled)');
      });
  });

  it('/api/data-with-specific-cors (GET) - includes specific origin in CORS headers', () => {
    return request(app.getHttpServer())
      .get('/api/data-with-specific-cors')
      .expect(200)
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4001');
        expect(res.body.message).toBe('This is data from the API server (with specific CORS)');
      });
  });

  it('/api/data-with-preflight (OPTIONS) - handles preflight request', () => {
    return request(app.getHttpServer())
      .options('/api/data-with-preflight')
      .expect(204)
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBe('*');
        expect(res.headers['access-control-allow-methods']).toBe('GET, POST');
        expect(res.headers['access-control-allow-headers']).toBe(
          'Content-Type, X-Custom-Header'
        );
        expect(res.headers['access-control-max-age']).toBe('3600');
      });
  });

  it('/api/data-with-preflight (GET) - returns data with CORS headers', () => {
    return request(app.getHttpServer())
      .get('/api/data-with-preflight')
      .expect(200)
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBe('*');
        expect(res.body.message).toBe('This is data from the API server (with preflight handling)');
      });
  });

  it('/api/data-with-nest-cors (OPTIONS) - handles manual preflight for specified origin', () => {
    return request(app.getHttpServer())
      .options('/api/data-with-nest-cors')
      .expect(204)
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4001');
        expect(res.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
        expect(res.headers['access-control-allow-headers']).toBe(
          'Content-Type, X-Custom-Header'
        );
        expect(res.headers['access-control-allow-credentials']).toBe('true');
        expect(res.headers['access-control-max-age']).toBe('3600');
      });
  });

  it('/api/data-with-nest-cors (GET) - returns data with CORS headers for specified origin', () => {
    return request(app.getHttpServer())
      .get('/api/data-with-nest-cors')
      .expect(200)
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4001');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
        expect(res.body.message).toBe('This is data from the API server (using NestJS CORS)');
      });
  });
}); 