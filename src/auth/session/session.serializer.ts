import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user: User, done: (err: Error, user: any) => void): any {
    done(null, { userId: user.userId, username: user.username });
  }

  deserializeUser(
    payload: { userId: number; username: string },
    done: (err: Error, user: any) => void,
  ): any {
    // In a real app, you might want to fetch the user from database here
    done(null, payload);
  }
} 