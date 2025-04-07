# NestJS Authentication Demo

This demo shows how to implement Basic Authentication in NestJS.

## Features

- Basic Authentication implementation with password hashing

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

This direct approach ensures proper handling of the HTTP Basic Authentication protocol and browser behavior.

## Testing

You can test the Basic Authentication endpoint using curl:

```bash
# No credentials (should fail)
curl -v http://localhost:3000/auth/basic

# Invalid credentials (should fail)
curl -v -u wrong:password http://localhost:3000/auth/basic

# Valid credentials (should succeed)
curl -v -u admin:secret http://localhost:3000/auth/basic
``` 