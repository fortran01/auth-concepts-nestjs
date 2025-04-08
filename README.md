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

4. Optional: Start Redis for persistent session storage:
```bash
docker-compose up -d
```

5. Start the application:
```bash
npm run start:dev
```

The application will start on http://localhost:3000

## Usage

The demo provides these endpoints:

- `GET /` - Welcome page (no authentication)
- `GET /auth/basic` - Protected by Basic Authentication
- `GET /auth/digest` - Protected by Digest Authentication
- `GET /auth/session/login` - Form login for session-based authentication
- `GET /auth/session/protected` - Protected by session authentication
- `GET /auth/session/setup-mfa` - Setup Multi-Factor Authentication
- `GET /auth/session/verify-mfa` - Verify MFA during login
- `GET /auth/session/logout` - Logout and destroy session

Default credentials:
- Username: `admin`
- Password: `secret`

## Session Authentication Implementation

The Stateful (Session) Authentication implementation uses the following components:

1. **Session Middleware** - Uses Express session middleware for managing user sessions
2. **Passport Integration** - Uses PassportJS with local strategy for authentication
3. **User Session Serialization** - Serializes user information for session storage
4. **Flash Messages** - Provides user feedback on operations
5. **MFA Support** - Adds an optional second authentication factor

When a user logs in:
1. The local strategy validates their credentials against stored users
2. Upon successful authentication, their session is established
3. Session information is stored server-side
4. Only a session ID is sent to the client as a cookie
5. Subsequent requests are authenticated using the session cookie
6. Sessions expire after a configurable time (1 day by default)

### Redis Session Storage (Optional)

The application can be configured to use Redis for session storage:

1. Start the Redis container with `docker-compose up -d`
2. Uncomment and configure the Redis session store in `src/main.ts`

Using Redis provides these advantages:
- Sessions persist across application restarts
- Better scalability for distributed deployments
- Centralized session management
- Independent session timeout control

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