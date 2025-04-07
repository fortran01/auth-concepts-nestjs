# Basic Authentication Tests

This directory contains tests for the Basic Authentication feature in the NestJS Authentication Demo.

## Types of Tests

The tests are organized into several files:

- **basic-auth.e2e-spec.ts**: End-to-end tests for the Basic Authentication endpoint
- **auth.service.spec.ts**: Unit tests for the AuthService
- **auth.controller.spec.ts**: Unit tests for the AuthController
- **basic-auth.guard.spec.ts**: Unit tests for the BasicAuthGuard
- **basic-auth.middleware.spec.ts**: Unit tests for the BasicAuthMiddleware

## Running the Tests

To run all auth tests:

```bash
npm run test:auth
```

To run a specific test file:

```bash
npm test -- test/auth/basic-auth.e2e-spec.ts
```

To run tests with watch mode:

```bash
npm run test:watch -- test/auth
```

To see test coverage:

```bash
npm run test:cov -- --testPathPattern=test/auth
```

## Test Structure

Each test suite follows this structure:

1. **Setup**: Create test modules and mock dependencies
2. **Unit Tests**: Test individual functions and methods
3. **Integration Tests**: Test component interaction
4. **End-to-End Tests**: Test complete request-response flows

## Test Helpers

The `helpers.ts` file contains utilities for testing authentication:

- `createBasicAuthHeader`: Creates Basic Authentication headers for testing
- `VALID_USER`: Sample valid user credentials
- `INVALID_USER`: Sample invalid user credentials 