import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class DebugService {
  constructor(private configService: ConfigService) {}

  async getRedisClient() {
    try {
      const client = createClient({
        url: this.configService.get('REDIS_URL') || 'redis://localhost:6380',
        socket: {
          connectTimeout: 5000, // 5 second timeout
        }
      });
      
      // Set up event handlers
      client.on('error', (err) => {
        console.error('Redis client error:', err);
      });
      
      await client.connect();
      return client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw new Error(`Redis connection error: ${error.message}`);
    }
  }

  async getRedisSessionData(sessionId: string, prefix = 'session:') {
    let redisClient = null;
    
    try {
      // Try to get Redis client
      try {
        redisClient = await this.getRedisClient();
      } catch (connectionError) {
        return {
          error: connectionError.message,
          sessionKeys: [],
          sessions: {},
          matchedSession: null,
        };
      }
      
      // Get all sessions
      const sessionKeys = await redisClient.keys(`${prefix}*`);
      
      // Prepare the clean session ID
      let cleanSessionId = sessionId;
      if (sessionId && sessionId.includes('.')) {
        cleanSessionId = sessionId.split('.')[0];
      }
      
      const redisKey = `${prefix}${cleanSessionId}`;
      
      // Initialize session containers
      const sessions: Record<string, any> = {};
      let matchedSession: any = null;
      
      // Process all sessions
      for (const key of sessionKeys) {
        try {
          // Get raw data
          const rawData = await redisClient.get(key);
          
          if (rawData) {
            // Redis stores session data in JSON format for connect-redis v8.x
            const sessionData = JSON.parse(rawData);
            
            // Add to sessions dictionary
            sessions[key] = sessionData;
            
            // Check if this is the current session
            if (key === redisKey) {
              matchedSession = sessionData;
            }
          }
        } catch (e) {
          sessions[key] = `Error decoding: ${e.message}`;
        }
      }
      
      // If not found but we have a session ID, try to load it directly
      if (!matchedSession && cleanSessionId) {
        try {
          const directKey = `${prefix}${cleanSessionId}`;
          const rawData = await redisClient.get(directKey);
          
          if (rawData) {
            matchedSession = JSON.parse(rawData);
          }
        } catch (e) {
          // Just continue if we can't decode
        }
      }
      
      return {
        sessionKeys,
        sessions,
        matchedSession,
      };
    } catch (error) {
      console.error('Error fetching Redis session data:', error);
      return {
        error: error.message,
        sessionKeys: [],
        sessions: {},
        matchedSession: null,
      };
    } finally {
      // Close Redis connection if it was opened
      if (redisClient && redisClient.isOpen) {
        try {
          await redisClient.disconnect();
        } catch (e) {
          console.error('Error closing Redis connection:', e);
        }
      }
    }
  }
} 