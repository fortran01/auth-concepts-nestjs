import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Digest Authentication (e2e)', () => {
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

  it('should return 401 when accessing protected route without authentication', () => {
    return request(app.getHttpServer())
      .get('/auth/digest')
      .expect(401)
      .expect((res) => {
        // Should have WWW-Authenticate header with Digest scheme
        expect(res.headers['www-authenticate']).toBeDefined();
        expect(res.headers['www-authenticate']).toContain('Digest realm="Restricted Access"');
        expect(res.headers['www-authenticate']).toContain('nonce="');
        expect(res.headers['www-authenticate']).toContain('opaque="');
      });
  });

  // Note: Testing actual digest authentication in e2e tests is complex 
  // because it requires multiple steps and custom header generation.
  // In a real-world scenario, you would use a library that supports 
  // digest auth or implement the challenge-response mechanism.
}); 