import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Determine the absolute path to the views directory
  // This works in both development and production
  const viewsPath = join(process.cwd(), 'src/views');
  console.log('Views directory path:', viewsPath);
  
  // Set up template engine
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');
  
  // Determine the absolute path to the public directory
  const publicPath = join(process.cwd(), 'src/public');
  console.log('Public directory path:', publicPath);
  
  // Serve static files
  app.useStaticAssets(publicPath);
  
  const configService = app.get(ConfigService);
  
  // Set up sessions with memory store (simple approach for the demo)
  // In production, you would use Redis or another external session store
  app.use(
    session({
      secret: configService.get('SESSION_SECRET') || 'super-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
      },
    }),
  );
  
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