import { Test, TestingModule } from '@nestjs/testing';
import { CsrfService } from './csrf.service';
import { Request } from 'express';

describe('CsrfService', () => {
  let service: CsrfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsrfService],
    }).compile();

    service = module.get<CsrfService>(CsrfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a CSRF token and store it in the session', () => {
    // Mock the request object with a session
    const mockRequest = {
      session: {},
    } as unknown as Request;

    // Generate a token
    const token = service.generateToken(mockRequest);

    // Check that the token was generated and stored in the session
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(32); // Tokens are at least 32 bytes (64 hex chars)
    expect(mockRequest.session['csrf_token']).toBe(token);
  });

  it('should return the same token if one already exists in the session', () => {
    // Mock the request object with a session that already has a token
    const existingToken = 'existing-token';
    const mockRequest = {
      session: {
        csrf_token: existingToken,
      },
    } as unknown as Request;

    // Generate a token
    const token = service.generateToken(mockRequest);

    // Check that the existing token was returned
    expect(token).toBe(existingToken);
  });

  it('should validate a token that matches the one in the session', () => {
    // Mock the request object with a session that has a token
    const mockToken = 'valid-token';
    const mockRequest = {
      session: {
        csrf_token: mockToken,
      },
    } as unknown as Request;

    // Validate the token
    const isValid = service.validateToken(mockRequest, mockToken);

    // Check that the token was validated
    expect(isValid).toBe(true);
  });

  it('should reject a token that does not match the one in the session', () => {
    // Mock the request object with a session that has a token
    const mockToken = 'valid-token';
    const mockRequest = {
      session: {
        csrf_token: mockToken,
      },
    } as unknown as Request;

    // Validate a different token
    const isValid = service.validateToken(mockRequest, 'invalid-token');

    // Check that the token was rejected
    expect(isValid).toBe(false);
  });

  it('should reject a token if there is no token in the session', () => {
    // Mock the request object with an empty session
    const mockRequest = {
      session: {},
    } as unknown as Request;

    // Validate a token
    const isValid = service.validateToken(mockRequest, 'some-token');

    // Check that the token was rejected
    expect(isValid).toBe(false);
  });
});
