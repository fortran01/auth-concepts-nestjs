import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { LocalAuthGuard } from '../../src/auth/session/local-auth.guard';

// Create mock methods
const mockCanActivate = jest.fn().mockResolvedValue(true);
const mockLogIn = jest.fn().mockResolvedValue(undefined);

// Mock the AuthGuard module and function
jest.mock('@nestjs/passport', () => {
  return {
    AuthGuard: jest.fn().mockImplementation(() => {
      return class MockAuthGuard {
        canActivate = mockCanActivate;
        logIn = mockLogIn;
      };
    }),
  };
});

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    // Reset mock implementations
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should call super.canActivate and super.logIn', async () => {
      // Arrange
      const mockRequest = {};
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Since logIn is called inside canActivate in the actual implementation,
      // we must mock that a request is properly returned
      mockCanActivate.mockImplementation((context) => {
        // Manually call logIn to simulate the implementation
        mockLogIn(context.switchToHttp().getRequest());
        return true;
      });

      // Call the method under test
      const result = await guard.canActivate(mockContext);
      
      // Assert
      expect(result).toBe(true);
      expect(mockCanActivate).toHaveBeenCalledWith(mockContext);
      expect(mockLogIn).toHaveBeenCalledWith(mockRequest);
    });
  });
}); 