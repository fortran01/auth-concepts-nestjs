import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebugModule } from './debug/debug.module';
import { CorsModule } from './cors/cors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    DebugModule,
    CorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 