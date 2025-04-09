# Authentication Tests

This directory contains tests for the authentication features in the NestJS Authentication Demo.

## Types of Tests

The tests are organized into several files:

### Basic Authentication
- **basic-auth.e2e-spec.ts**: End-to-end tests for the Basic Authentication endpoint
- **auth.service.spec.ts**: Unit tests for the AuthService
- **auth.controller.spec.ts**: Unit tests for the AuthController
- **basic-auth.guard.spec.ts**: Unit tests for the BasicAuthGuard
- **basic-auth.middleware.spec.ts**: Unit tests for the BasicAuthMiddleware

### Session-based Authentication
- **session-auth.e2e-spec.ts**: End-to-end tests for session authentication
- **session.controller.spec.ts**: Unit tests for the SessionController
- **session.service.spec.ts**: Unit tests for the SessionService
- **session.guard.spec.ts**: Unit tests for the SessionGuard
- **session.serializer.spec.ts**: Unit tests for the SessionSerializer
- **local.strategy.spec.ts**: Unit tests for the LocalStrategy

### Token Authentication
- **token-auth.e2e-spec.ts**: End-to-end tests for token authentication
- **token.controller.spec.ts**: Unit tests for the TokenController
- **token.service.spec.ts**: Unit tests for the TokenService
- **jwt.strategy.spec.ts**: Unit tests for the JwtStrategy
- **jwt-auth.guard.spec.ts**: Unit tests for the JwtAuthGuard

### Digest Authentication
- **digest-auth.e2e-spec.ts**: End-to-end tests for digest authentication
- **digest-auth.spec.ts**: Unit tests for the digest authentication components

### LDAP Authentication
- **ldap-auth.e2e-spec.ts**: End-to-end tests for LDAP authentication
- **ldap.controller.spec.ts**: Unit tests for the LdapController
- **ldap.service.spec.ts**: Unit tests for the LdapService

### Auth0 Authentication
- **auth0-auth.e2e-spec.ts**: End-to-end tests for Auth0 authentication
- **auth0.controller.spec.ts**: Unit tests for the Auth0Controller
- **auth0.service.spec.ts**: Unit tests for the Auth0Service
- **auth0.guard.spec.ts**: Unit tests for the Auth0Guard
- **auth0.strategy.spec.ts**: Unit tests for the Auth0Strategy

## Running the Tests

To run all auth tests:

```bash
npm run test:auth
```

To run a specific test file:

```bash
npm test -- test/auth/ldap.service.spec.ts
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

## LDAP Authentication Tests

The LDAP authentication tests verify:

1. **Service Tests**: 
   - Connection to LDAP server
   - User authentication against LDAP
   - User details retrieval
   - Error handling

2. **Controller Tests**:
   - Login page rendering
   - Authentication flow
   - Handling successful and failed logins
   - Logout functionality
   - Test connection endpoint

3. **E2E Tests**:
   - Complete login flow
   - Handling invalid credentials
   - Displaying user information after login
   - Testing connection status

## Auth0 Authentication Tests

The Auth0 authentication tests verify:

1. **Service Tests**:
   - Exchange of authorization code for tokens
   - Retrieval of user profile with access token
   - Error handling for failed requests

2. **Controller Tests**:
   - Redirection to Auth0 login page
   - Handling callback with authorization code
   - Session management for authenticated users
   - Profile page rendering
   - Logout functionality

3. **Guard Tests**:
   - Protection of routes based on session authentication
   - Proper authentication state detection

4. **Strategy Tests**:
   - Configuration of Auth0 strategy with correct parameters
   - User profile validation and transformation

5. **E2E Tests**:
   - Complete Auth0 authentication flow
   - Login redirection
   - Callback processing
   - Session persistence
   - Profile display
   - Logout and session clearing 