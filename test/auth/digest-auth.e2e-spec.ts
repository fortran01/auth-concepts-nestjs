import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { createHash } from 'crypto';
import { join } from 'path';

describe('Digest Authentication (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Create app with proper express typing
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Set up view engine properly like in main.ts
    const viewsPath = join(process.cwd(), 'src/views');
    app.setBaseViewsDir(viewsPath);
    app.setViewEngine('hbs');
    
    // Set up static assets
    const publicPath = join(process.cwd(), 'src/public');
    app.useStaticAssets(publicPath);
    
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

  it('should successfully authenticate with valid digest credentials', async () => {
    // First, get the challenge (WWW-Authenticate header)
    const challengeResponse = await request(app.getHttpServer())
      .get('/auth/digest')
      .expect(401);

    // Get the WWW-Authenticate header and parse it
    const authHeader = challengeResponse.headers['www-authenticate'];
    const parts = authHeader.split(',').map(part => part.trim());
    
    // Parse the header parts
    const authParams: Record<string, string> = {};
    for (const part of parts) {
      const match = part.match(/^(?:Digest\s+)?([^=]+)="([^"]+)"/i);
      if (match) {
        authParams[match[1]] = match[2];
      }
    }

    // Check if we have the required fields
    expect(authParams.realm).toBeDefined();
    expect(authParams.nonce).toBeDefined();
    expect(authParams.opaque).toBeDefined();
    
    // Prepare the digest response
    const username = 'admin';
    const password = 'secret';
    const realm = authParams.realm;
    const nonce = authParams.nonce;
    const uri = '/auth/digest';
    const method = 'GET';
    const qop = authParams.qop;
    
    // Calculate digest response components
    const ha1 = createHash('md5')
      .update(`${username}:${realm}:${password}`)
      .digest('hex');
      
    const ha2 = createHash('md5')
      .update(`${method}:${uri}`)
      .digest('hex');
    
    // Generate client nonce and nonce count if qop is specified
    let digestResponse: string;
    let cnonce: string;
    let nc: string;
    
    if (qop) {
      cnonce = Math.random().toString(36).substring(2, 15);
      nc = '00000001';
      
      // MD5(HA1:nonce:nc:cnonce:qop:HA2)
      digestResponse = createHash('md5')
        .update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
        .digest('hex');
    } else {
      // MD5(HA1:nonce:HA2)
      digestResponse = createHash('md5')
        .update(`${ha1}:${nonce}:${ha2}`)
        .digest('hex');
    }
    
    // Build the Authorization header
    let authValue = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${digestResponse}"`;
    
    if (qop) {
      authValue += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
    }
    
    if (authParams.opaque) {
      authValue += `, opaque="${authParams.opaque}"`;
    }
    
    // Send the authenticated request
    return request(app.getHttpServer())
      .get('/auth/digest')
      .set('Authorization', authValue)
      .expect(200)
      .expect((res) => {
        // Should contain some HTML content from the digest-auth.hbs template
        expect(res.text).toContain('Digest Authentication Success');
        expect(res.text).toContain('Hello admin');
      });
  });

  // Note: Testing actual digest authentication in e2e tests is complex 
  // because it requires multiple steps and custom header generation.
  // In a real-world scenario, you would use a library that supports 
  // digest auth or implement the challenge-response mechanism.
}); 