import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class NonceService {
  private readonly nonces: Set<string> = new Set();
  private readonly nonceLifetimeMs = 300000; // 5 minutes in milliseconds
  private readonly nonceCleanupIntervalMs = 60000; // 1 minute in milliseconds

  constructor() {
    // Periodically clean up expired nonces
    setInterval(() => this.cleanupExpiredNonces(), this.nonceCleanupIntervalMs);
  }

  /**
   * Generate a new nonce and store it with its timestamp
   */
  generateNonce(): string {
    // Generate a random nonce
    const nonce = randomBytes(16).toString('hex');
    
    // Store the nonce with its creation timestamp
    this.nonces.add(nonce);
    
    // Store expiration time for cleanup
    setTimeout(() => {
      this.nonces.delete(nonce);
    }, this.nonceLifetimeMs);
    
    return nonce;
  }

  /**
   * Check if a nonce is valid (exists in our store)
   */
  isValidNonce(nonce: string): boolean {
    return this.nonces.has(nonce);
  }

  /**
   * Clean up expired nonces
   * (This is redundant with our setTimeout approach but provides additional safety)
   */
  private cleanupExpiredNonces(): void {
    // With our approach using setTimeout to delete expired nonces,
    // we don't need additional cleanup logic here, but in a production
    // system you might want to store nonces with timestamps and clean them up
    // based on their age.
  }
} 