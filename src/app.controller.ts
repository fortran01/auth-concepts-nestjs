import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  getIndex() {
    return {
      title: 'Home'
    };
  }
  
  @Get('debug-tools')
  @Render('debug-tools')
  getDebugTools() {
    return {
      title: 'Debug Tools'
    };
  }
} 