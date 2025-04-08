import { Controller, Get, Header, HttpCode, Options, Req, Res, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { CorsService } from './cors.service';

@Controller('api')
export class CorsApiController {
  constructor(private readonly corsService: CorsService) {}
  
  // Endpoint without CORS headers - scenario 1
  // This will be blocked by browsers in cross-origin requests
  @Options('data')
  @HttpCode(204)
  handleNoCorsOptions() {
    // This will not be called because our middleware will handle the request
    console.log('[CorsApiController] handleNoCorsOptions called - but this should not happen');
    return '';
  }
  
  @Get('data')
  getData() {
    // This will not be called because our middleware will handle the request
    console.log('[CorsApiController] getData called - but this should not happen');
    return this.corsService.getData();
  }
  
  // Endpoint with CORS headers allowing all origins - scenario 2
  @Get('data-with-cors')
  getDataWithCors(@Res() res: Response) {
    const data = this.corsService.getDataWithCors();
    res.header('Access-Control-Allow-Origin', '*');
    return res.json(data);
  }
  
  // Endpoint with CORS headers allowing specific origin - scenario 3
  @Get('data-with-specific-cors')
  getDataWithSpecificCors(@Res() res: Response) {
    const data = this.corsService.getDataWithSpecificCors();
    res.header('Access-Control-Allow-Origin', 'http://localhost:4001');
    return res.json(data);
  }
  
  // Endpoint with preflight handling - scenario 4
  @Options('data-with-preflight')
  @HttpCode(204)
  handlePreflight(@Res() res: Response) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Custom-Header');
    res.header('Access-Control-Max-Age', '3600');
    return res.send();
  }
  
  @Get('data-with-preflight')
  getDataWithPreflight(@Res() res: Response) {
    const data = this.corsService.getDataWithPreflight();
    res.header('Access-Control-Allow-Origin', '*');
    return res.json(data);
  }
  
  // Endpoint using NestJS CORS - scenario 5
  @Options('data-with-nest-cors')
  @HttpCode(204)
  handleNestCorsPreflight(@Res() res: Response) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4001');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Custom-Header');
    res.header('Access-Control-Max-Age', '3600');
    return res.send();
  }
  
  @Get('data-with-nest-cors')
  getDataWithNestCors(@Res() res: Response) {
    const data = this.corsService.getDataWithNestCors();
    // Add CORS headers for the specific route
    res.header('Access-Control-Allow-Origin', 'http://localhost:4001');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Custom-Header');
    return res.json(data);
  }
} 