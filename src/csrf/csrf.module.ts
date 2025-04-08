import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CsrfController } from './csrf.controller';
import { CsrfService } from './csrf.service';
import { CsrfMiddleware } from './middleware/csrf.middleware';

@Module({
  controllers: [CsrfController],
  providers: [CsrfService],
  exports: [CsrfService],
})
export class CsrfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CSRF middleware only to the protected route
    consumer
      .apply(CsrfMiddleware)
      .forRoutes({ path: 'csrf-demo/update-username-protected', method: RequestMethod.POST });
  }
}
