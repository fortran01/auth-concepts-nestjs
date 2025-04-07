# NestJS Authentication Demo

This demo shows how to implement different authentication mechanisms in NestJS.

## Features

- Basic Authentication implementation with password hashing
- Digest Authentication with nonce-based challenge-response

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

4. Start the application:
```bash
npm run start:dev
```

The application will start on http://localhost:3000

## Usage

The demo provides these endpoints:

- `GET /` - Welcome page (no authentication)
- `GET /auth/basic` - Protected by Basic Authentication
- `GET /auth/digest` - Protected by Digest Authentication

Default credentials:
- Username: `admin`
- Password: `secret`

## Basic Authentication Implementation

The Basic Authentication implementation uses the following components:

1. **UsersService** - Manages user data and provides a method to find users by username
2. **AuthService** - Validates user credentials using bcrypt for password hashing
3. **Direct Response Handling** - Implements authentication directly in the controller with proper HTTP headers

When a request is made to a protected route:
1. The controller checks for the Authorization header
2. If the header is missing or invalid, it returns a 401 status with a WWW-Authenticate header
3. The credentials are decoded and validated against the user database
4. If valid, the protected resource is rendered
5. If invalid, a 401 response is returned with the WWW-Authenticate header to prompt for credentials

## Digest Authentication Implementation

The Digest Authentication implementation uses the following components:

1. **NonceService** - Manages nonce generation and validation for preventing replay attacks
2. **DigestAuthGuard** - Implements the Digest Authentication protocol as a NestJS guard
3. **DigestAuthMiddleware** - Alternative implementation as middleware for app-wide usage

Digest Authentication works as follows:
1. The client makes a request to a protected resource
2. The server responds with a 401 status and a WWW-Authenticate header containing a nonce
3. The client calculates an MD5 hash of the username, realm, and password (HA1)
4. The client calculates an MD5 hash of the HTTP method and URI (HA2)
5. The client creates a response by hashing HA1:nonce:HA2
6. The client sends this response along with other credentials in the Authorization header
7. The server performs the same hash calculations and compares with the client-provided response
8. If valid, the server grants access to the protected resource

Advantages over Basic Authentication:
- Passwords are not sent in plaintext
- Nonce values help prevent replay attacks
- More secure while still widely supported

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