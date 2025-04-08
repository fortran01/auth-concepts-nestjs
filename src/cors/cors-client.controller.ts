import { Controller, Get, Render } from '@nestjs/common';

@Controller('cors-demo')
export class CorsClientController {
  @Get()
  @Render('cors-demo')
  getCorsDemo() {
    return {
      title: 'CORS Demo',
      activeTab: 'cors-demo'
    };
  }
  
  @Get('info')
  @Render('cors-demo-info')
  getCorsInfo() {
    return {
      title: 'CORS Demo Information',
      activeTab: 'cors-demo'
    };
  }
} 