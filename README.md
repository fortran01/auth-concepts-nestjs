# NestJS Authentication Demo

This demo shows how to implement various authentication mechanisms in NestJS.

## Features

- Basic Authentication implementation with password hashing
- Digest Authentication with nonce-based challenge-response
- Stateful Authentication with session management
  - Form-based authentication with user-friendly UI
  - Server-side session storage (memory for demo, Redis-ready)
  - Multi-Factor Authentication (MFA) with verification codes
  - Session timeout and secure cookies
  - Flash messages for user feedback
- Stateless Authentication with JWT tokens
  - Token-based authentication with no server-side storage
  - JWT (JSON Web Tokens) for secure, self-contained claims
  - Client-side token storage using browser localStorage
  - Authorization header for API requests
- LDAP Authentication
  - Direct binding to LDAP server for authentication
  - LDAP user attribute retrieval
  - No password storage in application
  - Includes OpenLDAP server in Docker for testing
- Cross-Origin Resource Sharing (CORS) Demo
  - Demonstrates browser's Same-Origin Policy
  - Shows how CORS headers enable controlled cross-origin access
  - Illustrates various CORS configurations
  - Displays preflight requests in action
- Cross-Site Request Forgery (CSRF) Protection Demo
  - Demonstrates how CSRF attacks work
  - Shows vulnerable and protected implementations
  - Explains CSRF token-based protection
  - Includes a simulated malicious site for testing

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a .env file (or copy from .env.example):
```bash
cp .env.example .env
```

4. Start Docker containers (Redis and OpenLDAP):
```bash
docker-compose up -d
```

5. Initialize LDAP test users:
```bash
npm run setup-ldap
```

6. Start the application:
```bash
npm run start:dev
```

The application will start on http://localhost:3000

## Usage

The demo provides these endpoints:

- `GET /` - Welcome page (no authentication)
- `GET /auth/basic` - Protected by Basic Authentication
- `GET /auth/digest` - Protected by Digest Authentication
- `GET /auth/ldap` - LDAP Authentication login form
- `POST /auth/ldap/login` - LDAP Authentication endpoint
- `GET /auth/ldap/logout` - LDAP logout endpoint
- `GET /auth/session/login` - Form login for session-based authentication
- `GET /auth/session/protected` - Protected by session authentication
- `GET /auth/session/setup-mfa` - Setup Multi-Factor Authentication
- `GET /auth/session/verify-mfa` - Verify MFA during login
- `GET /auth/session/logout` - Logout and destroy session
- `GET /token/login` - Form login for token-based authentication
- `POST /token/login` - API endpoint to get JWT token
- `GET /token/protected` - Protected by JWT token authentication
- `GET /token/data` - Protected API endpoint requiring JWT token
- `GET /cors-demo/info` - Information about the CORS demo
- `GET /cors-demo` - CORS demo UI
- `GET /api/data` - API endpoint without CORS headers
- `GET /api/data-with-cors` - API endpoint with CORS headers for all origins
- `GET /api/data-with-specific-cors` - API endpoint with CORS headers for specific origin
- `GET /api/data-with-preflight` - API endpoint that handles preflight requests
- `GET /api/data-with-nest-cors` - API endpoint with NestJS built-in CORS support
- `GET /debug/redis-session` - Debug tool for Redis session store (development only)
- `GET /csrf-demo` - CSRF vulnerability and protection demo
- `GET /csrf-demo/profile` - User profile page vulnerable to CSRF
- `POST /csrf-demo/update-email` - Vulnerable endpoint to update email
- `GET /csrf-demo/profile-protected` - User profile page protected against CSRF
- `POST /csrf-demo/update-email-protected` - Protected endpoint to update email
- `GET /csrf-demo/malicious-site` - Simulated malicious site for CSRF attacks

Default credentials:
- Username: `admin`
- Password: `secret`

LDAP test credentials:
- Username: `john.doe`
- Password: `password123`

or

- Username: `jane.smith`
- Password: `password456`

## Session Authentication Implementation

The Stateful (Session) Authentication implementation uses the following components:

1. **Session Middleware** - Uses Express session middleware for managing user sessions
2. **Passport Integration** - Uses PassportJS with local strategy for authentication
3. **User Session Serialization** - Serializes user information for session storage
4. **Flash Messages** - Provides user feedback on operations
5. **MFA Support** - Adds an optional second authentication factor
6. **Guards and Decorators** - Custom NestJS guards to protect routes
7. **CSRF Protection** - Prevents cross-site request forgery attacks

### Authentication Flow

When a user logs in:
1. The local strategy validates their credentials against stored users
2. Upon successful authentication, their session is established
3. Session information is stored server-side
4. Only a session ID is sent to the client as a cookie
5. Subsequent requests are authenticated using the session cookie
6. Sessions expire after a configurable time (1 day by default)

### Multi-Factor Authentication

The MFA implementation follows these steps:
1. User logs in with username and password
2. If MFA is enabled, user is redirected to verification page
3. User enters the verification code
4. Code is validated against the stored secret
5. Upon successful verification, the session is marked as fully authenticated

### Session Management

Sessions are managed with these features:
- Automatic timeout after inactivity
- Manual session termination via logout
- Secure, HTTP-only, and SameSite cookies
- Session data storage with configurable backends

### Redis Session Storage (Optional)

The application can be configured to use Redis for session storage:

1. Start the Redis container with `docker-compose up -d`
2. Uncomment and configure the Redis session store in `src/main.ts`

Using Redis provides these advantages:
- Sessions persist across application restarts
- Better scalability for distributed deployments
- Centralized session management
- Independent session timeout control

### Redis Session Debug Tool

The application includes a debug endpoint to inspect active Redis sessions:

```
http://localhost:3000/debug/redis-session
```

This tool provides the following features:
- View all active sessions in the Redis store
- Inspect session data, including user information and timestamps
- Monitor session expiration times
- Troubleshoot authentication issues

Note: This endpoint should be disabled or protected in production environments.

## CSRF Protection

The Cross-Site Request Forgery (CSRF) protection implementation demonstrates:

1. **How CSRF Attacks Work** - Shows how malicious sites can trick users into submitting unwanted requests
2. **Token-Based Protection** - Implements CSRF tokens to validate request authenticity
3. **Session Integration** - Tokens are stored in user sessions and validated on form submission
4. **Middleware Approach** - Uses NestJS middleware for validating CSRF tokens

### CSRF Demo Components

The CSRF demo includes these components:

1. **Vulnerable Profile Page** - Shows a form without CSRF protection
2. **Protected Profile Page** - Shows the same form with CSRF protection
3. **Malicious Site Simulator** - Demonstrates a third-party site that attempts to exploit the vulnerability
4. **CSRF Service** - Generates and validates CSRF tokens
5. **CSRF Middleware** - Automatically checks for valid tokens on protected endpoints

### Testing the CSRF Demo

The best way to test the CSRF protection is through the browser:

1. Visit the CSRF demo page: `http://localhost:3001/csrf-demo`
2. Visit the vulnerable profile page and note your current email address
3. In a new tab, visit the malicious site
4. Return to the vulnerable profile page and notice your email has been changed without consent
5. Try the same with the protected profile page - the attack will fail

## Security Considerations

- Session IDs are stored in HTTP-only cookies to prevent JavaScript access
- Passwords are hashed with bcrypt before storage
- Flash messages are stored server-side
- Multi-Factor Authentication adds an additional security layer
- Sessions can be manually invalidated via logout

## Testing

You can test the authentication endpoints using curl:

### Basic Authentication

```bash
# No credentials (should fail)
curl -v http://localhost:3000/auth/basic

# Invalid credentials (should fail)
curl -v -u wrong:password http://localhost:3000/auth/basic

# Valid credentials (should succeed)
curl -v -u admin:secret http://localhost:3000/auth/basic
```

### Digest Authentication

```bash
# Using the --digest flag to handle the challenge-response flow
curl -v --digest -u admin:secret http://localhost:3000/auth/digest
```

### Session Authentication

Best tested through the browser interface at:
```
http://localhost:3000/auth/session/login
``` 

You can also test session authentication programmatically:

```bash
# Login and get session cookie
COOKIE=$(curl -s -i -X POST http://localhost:3000/auth/session/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}' | grep -i "set-cookie" | cut -d' ' -f2)

# Access protected resource with session cookie
curl -v -H "Cookie: $COOKIE" http://localhost:3000/auth/session/protected

# Logout (invalidates session)
curl -v -H "Cookie: $COOKIE" http://localhost:3000/auth/session/logout
```

Note: For MFA-enabled accounts, additional steps are required to complete authentication. 

### LDAP Authentication

This demo includes a direct LDAP authentication method that authenticates users against an OpenLDAP server.

### How it works

1. User submits their username and password through a form
2. The application attempts to bind to the LDAP server using the user's credentials
3. If the binding is successful, the user is authenticated
4. The application retrieves the user's LDAP attributes and displays them
5. User can log out by clicking the logout button, which redirects to the login page

### Authentication Flow

1. **Login**: Submit credentials to `/auth/ldap/login`
2. **Authentication**: Direct binding to LDAP server with the provided credentials
3. **Access**: Upon successful authentication, access to protected information
4. **Logout**: Click the logout button to end the session and return to login page

### Setup

1. Start the Docker containers which include OpenLDAP:

```bash
docker-compose up -d
```

2. Initialize the LDAP directory with test users:

```bash
npm run setup-ldap
```

3. Access the LDAP authentication demo at `/auth/ldap`

### Test Users

The following test users are created in the LDAP directory:

| Username | Password |
|----------|----------|
| john.doe | password123 |
| jane.smith | password456 |

### LDAP Admin Interface

The demo also includes phpLDAPadmin, a web-based LDAP client to browse and manage the LDAP directory.

- Access URL: http://localhost:8090
- Login DN: `cn=admin,dc=example,dc=org`
- Password: `admin_password`

### Implementation Details

The LDAP authentication implementation uses these key components:

1. **LdapService**: Handles LDAP connection, binding and directory operations
2. **LdapController**: Manages the authentication flow and rendering templates
3. **Docker-based LDAP Server**: Provides a fully functional OpenLDAP server for testing
4. **phpLDAPadmin**: Offers a web interface for LDAP directory management

### Security Considerations

- No passwords are stored in the application; authentication is delegated to the LDAP server
- In production environments, always use LDAPS (LDAP over SSL/TLS) to encrypt credentials
- Use service accounts with least privilege for directory operations
- Implement rate limiting to prevent brute force attacks
- Apply proper error handling to avoid information disclosure 

## Stateless Authentication Implementation

The stateless (JWT token-based) authentication implementation uses these components:

1. **JWT Strategy** - Implements Passport JWT strategy for token validation
2. **Token Service** - Handles token generation and verification
3. **JWT Auth Guard** - Protects routes requiring valid tokens
4. **Client-side Storage** - Stores tokens in browser's localStorage
5. **Token-based API** - Uses Authorization header for API requests

### Authentication Flow

When a user logs in:
1. The user submits credentials (username/password)
2. The server validates credentials against stored users
3. Upon successful validation, a JWT token is generated with user information
4. The token is signed with a secret key and returned to the client
5. The client stores the token in localStorage
6. Subsequent requests include the token in the Authorization header
7. The server validates the token signature and extracts user information
8. No session data is stored on the server

### JWT Token Structure

JWT tokens consist of three parts:

1. **Header** - Contains algorithm information
2. **Payload** - Contains user information and token metadata
3. **Signature** - Verifies the token's integrity

The payload typically includes:
- `sub` - User ID (subject)
- `username` - User's username
- `iat` - Token issue timestamp
- `exp` - Token expiration timestamp

### Security Considerations

- Tokens are signed to prevent tampering
- Token expiration limits the window of opportunity for token misuse
- Tokens are stored in localStorage, making them vulnerable to XSS attacks
- The server validates token signatures to ensure authenticity
- No server-side storage means no ability to invalidate individual tokens
- Sensitive operations should still verify the user's password

## Testing

You can test the authentication endpoints using curl:

### Stateless (JWT) Authentication

```bash
# Get a JWT token with valid credentials
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}' \
  http://localhost:3000/token/login | jq -r '.access_token')

# Access protected API with JWT token
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:3000/token/data

# Invalid token (should fail)
curl -v -H "Authorization: Bearer invalid.token.here" http://localhost:3000/token/data
```

Best tested through the browser interface at:
```
http://localhost:3000/token/login
``` 

### Token Authentication

Token-based authentication can be tested through the browser interface at:
```
http://localhost:3000/token/login
```

You can also test token authentication programmatically:

```bash
# Get JWT token with valid credentials
TOKEN=$(curl -s -X POST http://localhost:3000/token/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}' | jq -r '.access_token')

# Access protected API endpoint with token
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:3000/token/data

# Access protected page with token
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:3000/token/protected
```

## Running Tests

The application includes comprehensive tests for all authentication methods:

```bash
# Run unit tests
npm run test

# Run integration/e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

### Test Coverage

Tests are organized to verify:

1. **Unit Tests** - Testing individual components:
   - Authentication services (AuthService, TokenService)
   - Authentication strategies (LocalStrategy, JwtStrategy)
   - Guards (SessionGuard, JwtAuthGuard)
   - Controllers (AuthController, TokenController)

2. **End-to-End Tests** - Testing complete authentication flows:
   - Basic auth flow with challenge-response
   - Digest auth flow with nonce validation
   - Session authentication with login/logout
   - Token authentication with JWT token generation/validation
   - Multi-factor authentication sequence

### Mocking Strategy

The tests use Jest for mocking:
- External dependencies like bcrypt are mocked
- NestJS testing utilities to create isolated module environments
- For E2E tests, a full application instance is created

## Test Files

- `auth.service.spec.ts` - Tests for the main auth service
- `basic-auth.guard.spec.ts` - Tests for basic auth guard
- `basic-auth.middleware.spec.ts` - Tests for basic auth middleware
- `basic-auth.e2e-spec.ts` - E2E tests for basic auth flow
- `digest-auth.spec.ts` - Tests for digest auth implementation
- `digest-auth.e2e-spec.ts` - E2E tests for digest auth flow
- `local.strategy.spec.ts` - Tests for local auth strategy
- `session.guard.spec.ts` - Tests for session-based guards
- `session.serializer.spec.ts` - Tests for user serialization
- `session.service.spec.ts` - Tests for session management
- `session.controller.spec.ts` - Tests for session endpoints
- `session-auth.e2e-spec.ts` - E2E tests for session auth flow
- `token.service.spec.ts` - Tests for JWT token service
- `jwt.strategy.spec.ts` - Tests for JWT strategy
- `jwt-auth.guard.spec.ts` - Tests for JWT auth guard
- `token.controller.spec.ts` - Tests for token endpoints
- `token-auth.e2e-spec.ts` - E2E tests for token auth flow 

## Cross-Origin Resource Sharing (CORS) Demo

This project includes a demonstration of Cross-Origin Resource Sharing (CORS) with different configuration approaches. To run the full CORS demo:

1. Start the API server on port 3001 (if not already running):
   ```
   npm run start
   ```

2. In a separate terminal, start the CORS client server on port 4001:
   ```
   npm run start:cors-client
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:4001/cors-demo
   ```

The demo demonstrates different CORS scenarios:
- No CORS headers (fails due to same-origin policy)
- CORS enabled for all origins
- CORS enabled for specific origin
- Complex requests with preflight OPTIONS handling
- Advanced CORS configuration with NestJS

Both servers must be running simultaneously for the demo to work properly.

### Features Demonstrated

- **Same-Origin Policy**: Shows how browsers block cross-origin requests by default
- **CORS Headers**: Demonstrates how proper headers enable cross-origin requests
- **Specific Origins**: Shows how to limit CORS access to specific origins
- **Preflight Requests**: Illustrates how complex requests trigger OPTIONS preflight
- **NestJS CORS Support**: Shows NestJS's built-in CORS implementation

### Endpoints

- `GET /api/data` - No CORS headers (will be blocked from different origin)
- `GET /api/data-with-cors` - CORS headers allowing all origins
- `GET /api/data-with-specific-cors` - CORS headers for specific origin only
- `GET /api/data-with-preflight` - Handles preflight requests for complex requests
- `GET /api/data-with-nest-cors` - Uses NestJS built-in CORS support

### Implementation Details

The CORS demo uses these key components:

1. **No CORS Headers**: A custom middleware strips all CORS headers from the response to demonstrate how browsers block cross-origin requests when no CORS headers are present
2. **Manual CORS Headers**: Shows how to manually add CORS headers to responses
3. **Origin Restrictions**: Shows how to restrict CORS access to specific origins
4. **Preflight Handling**: Demonstrates OPTIONS request handling for complex requests
5. **Advanced CORS Configuration**: Shows comprehensive CORS headers for production use

Each scenario in the demo shows a different aspect of CORS:

1. **Scenario 1** - No CORS headers: Shows a request being blocked by the browser due to Same-Origin Policy
2. **Scenario 2** - CORS enabled for all origins: Allows access from any origin with `Access-Control-Allow-Origin: *`
3. **Scenario 3** - CORS enabled for specific origin: Only allows access from the client application
4. **Scenario 4** - Complex request with preflight: Shows the browser sending an OPTIONS request first
5. **Scenario 5** - Complete CORS configuration: Shows a comprehensive set of CORS headers including credentials support

For deeper understanding, open your browser's Developer Tools and observe the Network tab while using the demo to see how CORS headers affect the requests. 