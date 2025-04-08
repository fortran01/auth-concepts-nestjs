import { Module } from '@nestjs/common';
import { LdapService } from './ldap.service';
import { LdapController } from './ldap.controller';

@Module({
  providers: [LdapService],
  controllers: [LdapController],
  exports: [LdapService],
})
export class LdapModule {} 