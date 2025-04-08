import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { authenticator } from 'otplib';

@Injectable()
export class SessionService {
  constructor(private usersService: UsersService) {}

  async getUser(userId: number): Promise<any> {
    // In a real application, this would fetch the user from a database
    const user = await this.usersService.findById(userId);
    if (user) {
      // We don't want to return the password
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  
  async setupMfa(userId: number): Promise<string> {
    // In a real app, we would generate a real MFA secret and store it
    const secret = authenticator.generateSecret(); // Generate a random secret
    // We'd store this in the user record
    return secret;
  }
  
  async verifyMfa(userId: number, token: string): Promise<boolean> {
    // First get the user to retrieve their MFA secret
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaSecret) {
      return true; // If MFA is not set up, consider it valid
    }
    
    // Use otplib authenticator to verify the token with the user's secret
    try {
      return authenticator.verify({ token, secret: user.mfaSecret });
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return false;
    }
  }
  
  // Method to verify a token with an explicit secret (used during setup)
  verifyWithSecret(token: string, secret: string): boolean {
    if (!token || !secret) {
      return false;
    }
    
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('Error verifying TOTP with secret:', error);
      return false;
    }
  }
  
  async enableMfa(userId: number, secret: string): Promise<boolean> {
    // Forward to the Users service
    return this.usersService.enableMfa(userId, secret);
  }
} 