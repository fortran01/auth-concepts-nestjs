import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

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
  const port = configService.get('PORT') || 3000;
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap(); 