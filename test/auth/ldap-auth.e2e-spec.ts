import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cheerio from 'cheerio';
import { LdapService } from '../../src/auth/ldap/ldap.service';

describe('LDAP Authentication (e2e)', () => {
  let app: NestExpressApplication;
  let ldapService: LdapService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(LdapService)
    .useValue({
      testConnection: jest.fn().mockResolvedValue({
        success: true,
        message: 'LDAP connection successful',
      }),
      authenticate: jest.fn().mockImplementation((username, password) => {
        // Mock authentication logic for test users
        if (username === 'john.doe' && password === 'password123') {
          return Promise.resolve({
            dn: `uid=${username},ou=People,dc=example,dc=org`,
            uid: username,
            cn: 'John Doe',
            sn: 'Doe',
            givenName: 'John',
            mail: 'john.doe@example.org',
            title: 'Software Engineer',
          });
        }
        return Promise.resolve(null); // Authentication failed
      }),
    })
    .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Set up same view engines and static assets as main app
    app.setBaseViewsDir(join(__dirname, '../../src/views'));
    app.setViewEngine('hbs');
    app.useStaticAssets(join(__dirname, '../../src/public'));
    
    ldapService = moduleFixture.get<LdapService>(LdapService);
    
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
          expect(response.text).toContain('LDAP Authentication');
        });
    });
  });

  describe('LDAP Login page', () => {
    it('should display the login form', () => {
      return request(app.getHttpServer())
        .get('/auth/ldap')
        .expect(200)
        .expect(response => {
          const $ = cheerio.load(response.text);
          expect($('h2').text()).toContain('LDAP Authentication');
          expect($('form').attr('action')).toBe('/auth/ldap/login');
          expect($('form').attr('method')).toBe('POST');
          expect($('input[name="username"]').length).toBe(1);
          expect($('input[name="password"]').length).toBe(1);
          expect($('button[type="submit"]').length).toBe(1);
        });
    });

    it('should display error message when provided in query params', () => {
      return request(app.getHttpServer())
        .get('/auth/ldap?error=Invalid+credentials')
        .expect(200)
        .expect(response => {
          const $ = cheerio.load(response.text);
          expect($('.alert-danger').text()).toContain('Invalid credentials');
        });
    });

    it('should display success message when provided in query params', () => {
      return request(app.getHttpServer())
        .get('/auth/ldap?success=Logged+out+successfully')
        .expect(200)
        .expect(response => {
          const $ = cheerio.load(response.text);
          expect($('.alert-success').text()).toContain('Logged out successfully');
        });
    });
  });

  describe('LDAP Authentication', () => {
    it('should reject login with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/ldap/login')
        .send({ username: '', password: '' })
        .expect(302)
        .expect('Location', '/auth/ldap?error=Username+and+password+are+required');
    });

    it('should reject login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/ldap/login')
        .send({ username: 'john.doe', password: 'wrong_password' })
        .expect(302)
        .expect('Location', '/auth/ldap?error=Invalid+username+or+password');
    });

    it('should accept login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/ldap/login')
        .send({ username: 'john.doe', password: 'password123' })
        .expect(201)
        .expect(response => {
          const $ = cheerio.load(response.text);
          expect($('h2').text()).toBe('LDAP Authentication Successful');
          expect($('.alert-success').text()).toContain('You have been authenticated');
          
          // Check if user details are displayed
          expect($('table').text()).toContain('John Doe');
          expect($('table').text()).toContain('john.doe@example.org');
          expect($('table').text()).toContain('Software Engineer');
        });
    });
  });

  describe('LDAP test connection endpoint', () => {
    it('should return success for a working connection', () => {
      return request(app.getHttpServer())
        .get('/auth/ldap/test')
        .expect(200)
        .expect(response => {
          expect(response.body.success).toBe(true);
          expect(response.body.message).toContain('LDAP connection successful');
        });
    });

    it('should handle failed connections', () => {
      // Mock a failed connection for this test only
      jest.spyOn(ldapService, 'testConnection').mockResolvedValueOnce({
        success: false,
        message: 'LDAP connection failed',
      });

      return request(app.getHttpServer())
        .get('/auth/ldap/test')
        .expect(200)
        .expect(response => {
          expect(response.body.success).toBe(false);
          expect(response.body.message).toContain('LDAP connection failed');
        });
    });
  });

  describe('LDAP logout', () => {
    it('should redirect to login page with success message', () => {
      return request(app.getHttpServer())
        .get('/auth/ldap/logout')
        .expect(302)
        .expect('Location', '/auth/ldap?success=You+have+been+successfully+logged+out');
    });
  });
}); 