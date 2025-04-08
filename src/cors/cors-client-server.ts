import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';

async function bootstrap() {
  // Don't enable CORS on the client app as it's only serving UI files
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false, // Explicitly disable CORS on client app
  });
  
  // Determine the absolute path to the views directory
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
  
  // Run on port 4001 for the client application
  await app.listen(4001);
  console.log(`Client application is running on: http://localhost:4001`);
}

bootstrap(); 