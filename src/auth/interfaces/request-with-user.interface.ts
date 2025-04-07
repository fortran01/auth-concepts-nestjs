import { Request } from 'express';
import { User } from '../users/users.service';

export interface RequestWithUser extends Request {
  user: Omit<User, 'password'>;
} 