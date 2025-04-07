/**
 * Authentication test helpers
 */

/**
 * Create basic auth header
 * @param username - username for basic auth
 * @param password - password for basic auth
 * @returns object with Authorization header
 */
export function createBasicAuthHeader(username: string, password: string): Record<string, string> {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return { Authorization: `Basic ${credentials}` };
}

/**
 * Valid test user
 */
export const VALID_USER = {
  username: 'admin',
  password: 'secret'
};

/**
 * Invalid test user
 */
export const INVALID_USER = {
  username: 'wrong',
  password: 'password'
}; 