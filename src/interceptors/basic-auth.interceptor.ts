import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class BasicAuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error instanceof UnauthorizedException) {
          const response = context.switchToHttp().getResponse();
          response.header('WWW-Authenticate', 'Basic realm="Login Required"');
        }
        return throwError(() => error);
      }),
    );
  }
} 