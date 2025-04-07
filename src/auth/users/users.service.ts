import { Injectable } from '@nestjs/common';

export type User = {
  userId: number;
  username: string;
  password: string;
};

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      userId: 1,
      username: 'admin',
      // password = 'secret' hashed with bcrypt - generated with a fresh hash
      password: '$2b$10$qpUpxPEjOH9jSWE7ITKnX.PRHY/6uYs35UJZggzK1BGBTLzLj4PhC',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
} 