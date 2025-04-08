import { Test, TestingModule } from '@nestjs/testing';
import { CsrfController } from './csrf.controller';
import { CsrfService } from './csrf.service';

// Create a mock for the CsrfService
const mockCsrfService = {
  generateToken: jest.fn().mockReturnValue('mock-csrf-token'),
  validateToken: jest.fn().mockReturnValue(true),
};

describe('CsrfController', () => {
  let controller: CsrfController;
  let service: CsrfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsrfController],
      providers: [
        {
          provide: CsrfService,
          useValue: mockCsrfService,
        },
      ],
    }).compile();

    controller = module.get<CsrfController>(CsrfController);
    service = module.get<CsrfService>(CsrfService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should render the CSRF demo page', () => {
    // Create a mock request object
    const mockRequest = {
      session: {},
    } as any;

    // Call the controller method
    const result = controller.getDemo(mockRequest);

    // Check that the CSRF token was generated
    expect(service.generateToken).toHaveBeenCalledWith(mockRequest);
    expect(result).toEqual({
      title: 'CSRF Vulnerability Demo',
      csrfToken: 'mock-csrf-token',
    });
  });

  it('should render the vulnerable profile page', () => {
    // Create a mock request object with a session
    const mockRequest = {
      session: {
        email: 'test@example.com',
      },
    } as any;

    // Call the controller method
    const result = controller.getProfile(mockRequest);

    // Check that the response includes the email from the session
    expect(result).toEqual({
      title: 'User Profile (Vulnerable to CSRF)',
      email: 'test@example.com',
      csrfProtected: false,
    });
  });

  it('should update the email address', () => {
    // Create a mock request object with a session
    const mockRequest = {
      session: {
        email: 'old@example.com',
      },
    } as any;

    // Create a mock body
    const mockBody = { email: 'new@example.com' };

    // Call the controller method
    const result = controller.updateEmail(mockRequest, mockBody);

    // Check that the email was updated in the session
    expect(mockRequest.session.email).toBe('new@example.com');
    expect(mockRequest.session.flash.success).toContain('Email updated successfully!');
    expect(result).toEqual({ url: '/csrf-demo/profile' });
  });
});
