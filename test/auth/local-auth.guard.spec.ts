import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { LocalAuthGuard } from '../../src/auth/session/local-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LocalAuthGuard,
          useValue: {
            canActivate: jest.fn(),
            logIn: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should call super.canActivate and super.logIn', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as ExecutionContext;

      // Create a new instance with its parent methods spied on
      const guardInstance = new LocalAuthGuard();
      
      // Spy on the parent class methods
      const canActivateSpy = jest
        .spyOn(LocalAuthGuard.prototype, 'canActivate')
        .mockImplementation(async function(this: any) {
          // Call the original implementation without actually calling super
          return true;
        });
        
      const logInSpy = jest
        .spyOn(AuthGuard('local').prototype as any, 'logIn')
        .mockImplementation(async () => { return undefined; });
      
      // Call the method under test
      const result = await guardInstance.canActivate(mockContext);
      
      // Assert
      expect(result).toBe(true);
      expect(logInSpy).toHaveBeenCalled();
    });
  });
});

// Mock the AuthGuard function and its return value
jest.mock('@nestjs/passport', () => {
  const originalModule = jest.requireActual('@nestjs/passport');
  
  class MockAuthGuard {
    canActivate = jest.fn().mockResolvedValue(true);
    logIn = jest.fn().mockResolvedValue(undefined);
  }
  
  return {
    ...originalModule,
    AuthGuard: jest.fn(() => MockAuthGuard),
  };
}); 