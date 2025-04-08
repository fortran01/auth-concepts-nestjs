import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import { createClient } from 'redis';
import * as cookieParser from 'cookie-parser';
import * as hbs from 'hbs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Determine the absolute path to the views directory
  // This works in both development and production
  const viewsPath = join(process.cwd(), 'src/views');
  console.log('Views directory path:', viewsPath);
  
  // Determine the path to the partials directory
  const partialsPath = join(process.cwd(), 'src/views/partials');
  console.log('Partials directory path:', partialsPath);
  
  // Register partials directory
  hbs.registerPartials(partialsPath);
  
  // Set up template engine
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');
  
  // Determine the absolute path to the public directory
  const publicPath = join(process.cwd(), 'src/public');
  console.log('Public directory path:', publicPath);
  
  // Serve static files
  app.useStaticAssets(publicPath);
  
  // Use cookie-parser middleware
  app.use(cookieParser());
  
  const configService = app.get(ConfigService);
  
  let redisStore;
  
  try {
    // Create Redis client
    const redisClient = createClient({
      url: configService.get('REDIS_URL') || 'redis://localhost:6380',
      socket: {
        connectTimeout: 5000, // 5 second timeout
      }
    });
    
    // Add event listeners for debugging
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });
    
    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });
    
    console.log('Attempting to connect to Redis...');
    await redisClient.connect();
    console.log('Redis client connected successfully');
    
    // Create Redis store (connect-redis v8.x syntax)
    const { RedisStore } = await import('connect-redis');
    
    redisStore = new RedisStore({
      client: redisClient,
      prefix: 'session:',
    });
    
    console.log('Redis session store created successfully');
  } catch (err) {
    console.error('Redis connection error:', err);
    console.log('Continuing with memory store. Some functionality like the Redis session debug tool will be limited.');
  }
  
  // Default session configuration
  const sessionConfig: session.SessionOptions = {
    secret: configService.get('SESSION_SECRET') || 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
    }
  };
  
  // Add Redis store if available
  if (redisStore) {
    sessionConfig.store = redisStore;
    console.log('Using Redis for session storage');
  } else {
    console.log('Using in-memory session storage - sessions will be lost on server restart');
  }
  
  // Set up sessions
  app.use(session(sessionConfig));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add flash message support
  app.use((req: any, res: any, next: any) => {
    // Initialize flash if not already set
    if (!req.session) {
      req.session = {};
    }
    
    if (!req.session.flash) {
      req.session.flash = {};
    }
    
    // Define the flash function
    req.flash = function(type: string, message?: string) {
      if (!req.session.flash) {
        req.session.flash = {};
      }
      
      if (!req.session.flash[type]) {
        req.session.flash[type] = [];
      }
      
      // Handle the case where flash is called to retrieve messages
      if (message === undefined) {
        const messages = req.session.flash[type] || [];
        req.session.flash[type] = []; // Clear after reading
        return messages;
      }
      
      // Otherwise, add the message
      req.session.flash[type].push(message);
      return req.session.flash[type];
    };
    
    // Make flash messages available to views
    res.locals.flash = req.session.flash;
    
    next();
  });
  
  const port = configService.get('PORT') || 3001;
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap(); 