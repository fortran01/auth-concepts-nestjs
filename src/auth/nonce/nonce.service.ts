import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface StoredNonce {
  value: string;
  expires: Date;
}

@Injectable()
export class NonceService implements OnModuleDestroy {
  private readonly nonces: Map<string, Date> = new Map();
  private readonly nonceLifetimeMs = 300000; // 5 minutes in milliseconds
  private readonly nonceCleanupIntervalMs = 60000; // 1 minute in milliseconds
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodically clean up expired nonces
    this.cleanupInterval = setInterval(() => this.cleanupExpiredNonces(), this.nonceCleanupIntervalMs);
  }

  onModuleDestroy() {
    // Clean up the interval when the module is destroyed
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Generate a new nonce and store it with its timestamp
   */
  generateNonce(): string {
    // Generate a random nonce
    const nonce = randomBytes(16).toString('hex');
    
    // Calculate expiration time
    const expires = new Date();
    expires.setTime(expires.getTime() + this.nonceLifetimeMs);
    
    // Store the nonce with its expiration time
    this.nonces.set(nonce, expires);
    
    return nonce;
  }

  /**
   * Check if a nonce is valid (exists in our store and not expired)
   */
  isValidNonce(nonce: string): boolean {
    if (!this.nonces.has(nonce)) {
      return false;
    }
    
    const expiry = this.nonces.get(nonce);
    const now = new Date();
    
    // Check if nonce has expired
    if (now > expiry) {
      // Clean up expired nonce
      this.nonces.delete(nonce);
      return false;
    }
    
    return true;
  }

  /**
   * Clean up expired nonces
   */
  private cleanupExpiredNonces(): void {
    const now = new Date();
    
    for (const [nonce, expiry] of this.nonces.entries()) {
      if (now > expiry) {
        this.nonces.delete(nonce);
      }
    }
  }

  /**
   * Clear all nonces (primarily for testing)
   */
  clearNonces(): void {
    this.nonces.clear();
  }

  /**
   * Get the count of stored nonces (for debugging and testing)
   */
  getNonceCount(): number {
    return this.nonces.size;
  }
} 