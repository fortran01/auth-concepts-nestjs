import { Controller, Get, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  getIndex(@Req() req: Request) {
    return {
      title: 'Home',
      // Make flash messages available to the template
      flash: req.session ? req.session['flash'] || {} : {}
    };
  }
  
  @Get('debug-tools')
  @Render('debug-tools')
  getDebugTools(@Req() req: Request) {
    return {
      title: 'Debug Tools',
      // Make flash messages available to the template
      flash: req.session ? req.session['flash'] || {} : {}
    };
  }
} 