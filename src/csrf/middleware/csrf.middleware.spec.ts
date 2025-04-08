import { UnauthorizedException } from '@nestjs/common';
import { CsrfMiddleware } from './csrf.middleware';
import { CsrfService } from '../csrf.service';
import { Request, Response } from 'express';

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let csrfService: CsrfService;

  beforeEach(() => {
    csrfService = {
      validateToken: jest.fn(),
    } as unknown as CsrfService;

    middleware = new CsrfMiddleware(csrfService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should skip validation for GET requests', () => {
    const mockRequest = {
      method: 'GET',
      path: '/path',
    } as unknown as Request;
    const mockResponse = {} as Response;
    const nextFn = jest.fn();

    middleware.use(mockRequest, mockResponse, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(csrfService.validateToken).not.toHaveBeenCalled();
  });

  it('should skip validation for HEAD requests', () => {
    const mockRequest = {
      method: 'HEAD',
      path: '/path',
    } as unknown as Request;
    const mockResponse = {} as Response;
    const nextFn = jest.fn();

    middleware.use(mockRequest, mockResponse, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(csrfService.validateToken).not.toHaveBeenCalled();
  });

  it('should skip validation for OPTIONS requests', () => {
    const mockRequest = {
      method: 'OPTIONS',
      path: '/path',
    } as unknown as Request;
    const mockResponse = {} as Response;
    const nextFn = jest.fn();

    middleware.use(mockRequest, mockResponse, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(csrfService.validateToken).not.toHaveBeenCalled();
  });

  it('should skip validation for API endpoints', () => {
    const mockRequest = {
      method: 'POST',
      path: '/api/endpoint',
    } as unknown as Request;
    const mockResponse = {} as Response;
    const nextFn = jest.fn();

    middleware.use(mockRequest, mockResponse, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(csrfService.validateToken).not.toHaveBeenCalled();
  });

  it('should redirect for protected profile page with invalid token', () => {
    const mockRequest = {
      method: 'POST',
      path: '/csrf-demo/update-username-protected',
      body: {
        csrf_token: 'invalid-token',
      },
    } as unknown as Request;
    const mockResponse = {
      redirect: jest.fn(),
    } as unknown as Response;
    const nextFn = jest.fn();

    // Mock the validateToken method to return false
    (csrfService.validateToken as jest.Mock).mockReturnValue(false);

    middleware.use(mockRequest, mockResponse, nextFn);

    expect(mockResponse.redirect).toHaveBeenCalledWith('/csrf-demo/profile-protected');
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for other routes with invalid token', () => {
    const mockRequest = {
      method: 'POST',
      path: '/other-route',
      body: {
        csrf_token: 'invalid-token',
      },
    } as unknown as Request;
    const mockResponse = {} as Response;
    const nextFn = jest.fn();

    // Mock the validateToken method to return false
    (csrfService.validateToken as jest.Mock).mockReturnValue(false);

    expect(() => {
      middleware.use(mockRequest, mockResponse, nextFn);
    }).toThrow(UnauthorizedException);
    
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should call next() when token is valid', () => {
    const mockRequest = {
      method: 'POST',
      path: '/csrf-demo/update-email-protected',
      body: {
        csrf_token: 'valid-token',
      },
    } as unknown as Request;
    const mockResponse = {} as Response;
    const nextFn = jest.fn();

    // Mock the validateToken method to return true
    (csrfService.validateToken as jest.Mock).mockReturnValue(true);

    middleware.use(mockRequest, mockResponse, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });
});
