import { Controller, Get, Req, Res, Header } from '@nestjs/common';
import { Request, Response } from 'express';
import { DebugService } from './debug.service';
import { ConfigService } from '@nestjs/config';

@Controller('debug')
export class DebugController {
  constructor(
    private debugService: DebugService,
    private configService: ConfigService,
  ) {}

  @Get('redis-session')
  async getRedisSession(@Req() req: Request, @Res() res: Response) {
    // Only allow in development mode
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    if (isProduction) {
      return res.redirect('/');
    }

    try {
      // Get session ID from cookie
      const cookieName = req.app.get('trust proxy') ? 'connect.sid' : 'connect.sid';
      const sessionId = req.cookies[cookieName];
      
      // Get current session data from request
      const currentSession = req.session || {};
      
      // Get session data from Redis
      const { sessionKeys, sessions, matchedSession, error } = 
        await this.debugService.getRedisSessionData(sessionId);
      
      // Extract clean session ID
      let cleanSessionId = null;
      if (sessionId) {
        if (sessionId.includes('.')) {
          cleanSessionId = sessionId.split('.')[0];
        } else {
          cleanSessionId = sessionId;
        }
      }
      
      // Prepare data object for response
      const data = {
        current_session_id: sessionId,
        clean_session_id: cleanSessionId,
        current_session: currentSession,
        current_session_from_redis: matchedSession,
        all_sessions: sessions,
        session_keys: sessionKeys,
        redis_error: error
      };
      
      // Check if client accepts HTML or prefers JSON
      const wantsJson = req.accepts(['json', 'html']) === 'json' || 
                         req.get('Accept')?.includes('application/json');
      
      if (wantsJson) {
        // Set proper content type for JSON
        res.setHeader('Content-Type', 'application/json');
        return res.json(data);
      } else {
        // Return HTML view
        return res.render('redis-session', data);
      }
    } catch (error) {
      const errorData = {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
      
      // Check if client accepts HTML or prefers JSON
      const wantsJson = req.accepts(['json', 'html']) === 'json' || 
                         req.get('Accept')?.includes('application/json');
      
      if (wantsJson) {
        // Set proper content type for JSON
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json(errorData);
      } else {
        // Return error response in the appropriate format
        return res.status(500).render('error', { 
          message: 'Error fetching Redis session data',
          error: errorData 
        });
      }
    }
  }
} 