import { Injectable } from '@nestjs/common';

@Injectable()
export class CorsService {
  getData() {
    return {
      message: 'This is data from the API server',
      status: 'success',
      data: [1, 2, 3, 4, 5]
    };
  }
  
  getDataWithCors() {
    return {
      message: 'This is data from the API server (with CORS enabled)',
      status: 'success',
      data: [1, 2, 3, 4, 5]
    };
  }
  
  getDataWithSpecificCors() {
    return {
      message: 'This is data from the API server (with specific CORS)',
      status: 'success',
      data: [1, 2, 3, 4, 5]
    };
  }
  
  getDataWithPreflight() {
    return {
      message: 'This is data from the API server (with preflight handling)',
      status: 'success',
      data: [1, 2, 3, 4, 5]
    };
  }
  
  getDataWithNestCors() {
    return {
      message: 'This is data from the API server (using NestJS CORS)',
      status: 'success',
      data: [1, 2, 3, 4, 5]
    };
  }
} 