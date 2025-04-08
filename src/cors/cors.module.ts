import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CorsApiController } from './cors-api.controller';
import { CorsClientController } from './cors-client.controller';
import { CorsService } from './cors.service';
import { DirectResponseMiddleware } from '../middleware/direct-response.middleware';

@Module({
  controllers: [CorsApiController, CorsClientController],
  providers: [CorsService],
  exports: [CorsService],
})
export class CorsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Use direct response middleware for the /api/data route
    // This completely bypasses the controller and any response middleware
    // ensuring no CORS headers can be added
    consumer
      .apply(DirectResponseMiddleware)
      .forRoutes(
        { path: 'api/data', method: RequestMethod.GET },
        { path: 'api/data', method: RequestMethod.OPTIONS }
      );
  }
} 