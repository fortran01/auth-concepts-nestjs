# Debug Tools

This module provides debugging tools for the NestJS authentication demo application.

## Available Tools

### Redis Session Debug

The Redis Session Debug tool (`/debug/redis-session`) provides a way to inspect Redis session data. It shows:

- Current session ID and clean session ID (without signature)
- Current session data from the current request
- Current session data as stored in Redis
- All sessions stored in Redis

This tool is useful for:
- Debugging session-related issues
- Understanding how sessions are stored in Redis
- Monitoring active sessions
- Verifying that session persistence is working correctly

## Usage

### Accessing the Debug Tools

1. Visit `/debug-tools` in your browser
2. Select the debug tool you want to use
3. The tools are only available in development mode for security reasons

### Redis Session Debug

When using Redis Session Debug, you'll see:
- **Session Information**: Shows the current session ID and its clean version (without signature)
- **Current Session Data**: Shows the current session data from both the request and Redis storage
- **All Redis Sessions**: Lists all sessions stored in Redis with their data

## Troubleshooting

### Redis Connection Issues

If you're having issues with the Redis Session Debug tool:

1. Make sure Redis is running:
   ```
   docker-compose up -d
   ```

2. Test Redis connectivity using the helper script:
   ```
   npm run test:redis
   ```

3. Check Redis logs:
   ```
   docker logs nestjs_auth_redis
   ```

4. Try connecting directly to Redis:
   ```
   redis-cli -p 6380 ping
   ```

### Common Issues

#### "Unexpected token '<', '<!DOCTYPE '... is not valid JSON"

This error occurs when the client-side JavaScript is trying to parse HTML as JSON. Try:
1. Clearing your browser cache
2. Explicitly requesting JSON format by adding `?format=json` to the URL
3. Using curl or Postman with the `Accept: application/json` header

#### "Redis connection error"

This means the application couldn't connect to the Redis server. Check:
1. Is Redis running? Run `docker ps` to confirm
2. Is Redis accessible on port 6380? Try `redis-cli -p 6380 ping`
3. Does your .env file have a correct REDIS_URL?

## Security Considerations

These debug tools expose sensitive information and should NEVER be used in production environments. They are:

1. Only enabled in development environment
2. Hidden behind explicit routes
3. Explicitly warned about sensitive data exposure

To disable these tools in production, set `NODE_ENV=production` in your environment. 