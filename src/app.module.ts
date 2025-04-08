import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebugModule } from './debug/debug.module';
import { CorsModule } from './cors/cors.module';
import { CsrfModule } from './csrf/csrf.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    DebugModule,
    CorsModule,
    CsrfModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 