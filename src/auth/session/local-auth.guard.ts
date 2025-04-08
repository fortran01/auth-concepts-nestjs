import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if authentication passes - this calls our Strategy
    const result = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    
    // Start session if authentication succeeds
    await super.logIn(request);
    
    return result;
  }
} 