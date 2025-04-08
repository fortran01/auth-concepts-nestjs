import { Injectable } from '@nestjs/common';

export type User = {
  userId: number;
  username: string;
  password: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
};

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      userId: 1,
      username: 'admin',
      // password = 'secret' hashed with bcrypt - generated with a fresh hash
      password: '$2b$10$qpUpxPEjOH9jSWE7ITKnX.PRHY/6uYs35UJZggzK1BGBTLzLj4PhC',
      mfaEnabled: false,
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
  
  async findById(userId: number): Promise<User | undefined> {
    return this.users.find(user => user.userId === userId);
  }
  
  async enableMfa(userId: number, secret: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.userId === userId);
    if (userIndex >= 0) {
      this.users[userIndex].mfaEnabled = true;
      this.users[userIndex].mfaSecret = secret;
      return true;
    }
    return false;
  }
} 