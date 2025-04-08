import { Controller, Get, Post, Req, Res, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { LdapService } from './ldap.service';

interface LdapLoginDto {
  username: string;
  password: string;
}

@Controller('auth/ldap')
export class LdapController {
  private readonly logger = new Logger(LdapController.name);

  constructor(private readonly ldapService: LdapService) {}

  @Get()
  async getLdapLoginPage(@Req() req: Request, @Res() res: Response) {
    return res.render('ldap-login', {
      title: 'LDAP Authentication',
      message: 'Please log in with your LDAP credentials',
      error: req.query.error,
    });
  }

  @Get('test')
  async testLdapConnection(@Res() res: Response) {
    try {
      // Test connection with admin credentials
      const result = await this.ldapService.testConnection();
      return res.json({ success: result.success, message: result.message });
    } catch (error) {
      this.logger.error('LDAP test connection error', error);
      return res.status(500).json({ 
        success: false, 
        message: 'LDAP connection test failed', 
        error: error.message 
      });
    }
  }

  @Post('login')
  async ldapLogin(@Body() loginDto: LdapLoginDto, @Res() res: Response) {
    try {
      // Validate input
      if (!loginDto.username || !loginDto.password) {
        this.logger.warn('Login attempt with missing username or password');
        return res.redirect('/auth/ldap?error=Username+and+password+are+required');
      }
      
      // Debug the request body
      this.logger.debug(`Login attempt for user: ${loginDto.username}`);
      this.logger.debug(`Request body username: ${loginDto.username}`);
      
      // Check if we can first validate with the test endpoint
      const testResult = await this.ldapService.testConnection();
      this.logger.debug(`LDAP connection test before login: ${JSON.stringify(testResult)}`);
      
      if (!testResult.success) {
        this.logger.error(`LDAP connection test failed before attempting login: ${testResult.message}`);
        return res.redirect('/auth/ldap?error=LDAP+server+connection+failed');
      }
      
      // Attempt LDAP authentication
      const user = await this.ldapService.authenticate(loginDto.username, loginDto.password);
      
      if (!user) {
        this.logger.warn(`Failed login attempt for user: ${loginDto.username}`);
        return res.redirect('/auth/ldap?error=Invalid+username+or+password');
      }
      
      // Successful login
      this.logger.log(`Successful login for user: ${loginDto.username}`);
      this.logger.debug(`User details to render: ${JSON.stringify(user, null, 2)}`);
      
      // Make sure all required user properties are present with fallbacks
      const displayUser = {
        dn: user.dn || `uid=${loginDto.username},ou=People,dc=example,dc=org`,
        uid: user.uid || loginDto.username,
        cn: user.cn || loginDto.username,
        sn: user.sn || '',
        givenName: user.givenName || '',
        mail: user.mail || '',
        title: user.title || '',
      };
      
      // Render the protected page
      return res.render('ldap-protected', {
        title: 'LDAP Authentication Successful',
        message: `Welcome, ${displayUser.cn}!`,
        user: displayUser,
      });
    } catch (error) {
      this.logger.error(`LDAP login error: ${error.message}`, error.stack);
      return res.redirect('/auth/ldap?error=Authentication+failed');
    }
  }
}