# Authentication System Documentation

## Overview

The application uses a dual authentication system that supports both **JWT-based token authentication** (recommended) and **session-based authentication** (backwards compatible).

## Authentication Flow

### 1. Google OAuth Login

Users authenticate via Google OAuth 2.0:

```
User → Frontend → Backend /api/auth/google → Google OAuth → Callback
```

### 2. Token Generation

On successful OAuth callback:

1. Backend verifies user with Google
2. Creates/updates user in database
3. Generates JWT token with user information
4. Redirects to frontend with token in URL hash: `https://frontend.com#token=<jwt>`

### 3. Token Storage

Frontend extracts token from URL hash and:
- Stores in `localStorage` with key `auth_token`
- Removes token from URL for security
- Checks authentication with new token

### 4. API Authentication

All protected API requests include the JWT token:

```javascript
Authorization: Bearer <jwt_token>
```

## Backend Implementation

### JWT Token Generation (`backend/src/utils/jwt.js`)

```javascript
// Generates JWT token with user information
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'ideal-sniffle-backend'
  });
}
```

### Authentication Middleware (`backend/src/middleware/auth.js`)

The `requireAuth` middleware supports both authentication methods:

1. **JWT Token** (Primary): Checks `Authorization` header
2. **Session** (Fallback): Checks `req.isAuthenticated()`

```javascript
export function requireAuth(req, res, next) {
  // Try JWT first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }
  
  // Fall back to session
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: 'Authentication required' });
}
```

## Frontend Implementation

### Token Management (`frontend/src/utils/auth.js`)

Utility functions for managing authentication tokens:

```javascript
// Get stored token
export const getToken = () => localStorage.getItem('auth_token');

// Store token
export const setToken = (token) => localStorage.setItem('auth_token', token);

// Remove token
export const removeToken = () => localStorage.removeItem('auth_token');

// Authenticated fetch with automatic token inclusion
export const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, { ...options, headers });
};
```

### Token Extraction on OAuth Callback

```javascript
useEffect(() => {
  const hash = window.location.hash;
  if (hash && hash.includes('token=')) {
    const tokenMatch = hash.match(/token=([^&]+)/);
    if (tokenMatch && tokenMatch[1]) {
      const token = decodeURIComponent(tokenMatch[1]);
      setToken(token);
      window.location.hash = ''; // Clean up URL
      checkAuthWithToken();
    }
  }
}, []);
```

## Security Features

### 1. Token Transmission Security
- **URL Hash**: Tokens passed via URL hash (`#token=...`) instead of query parameters
- **Why**: Hash fragments are not sent to server, don't appear in logs or referrer headers
- **Cleanup**: Token immediately removed from URL after extraction

### 2. Production Security
- **Required Secret**: JWT_SECRET must be set in production (no fallback)
- **Error on Missing**: Application throws error if JWT_SECRET missing in production
- **Strong Secrets**: Recommend 32+ character random strings

### 3. Token Security
- **Expiration**: 7-day default expiry (configurable via JWT_EXPIRY)
- **Issuer**: Tokens include issuer claim for verification
- **Validation**: Full signature and expiry validation on each request

### 4. Rate Limiting
- **Auth Endpoints**: 10 requests per 15 minutes
- **API Endpoints**: 100 requests per 15 minutes
- **Trust Proxy**: Enabled for proper IP identification in serverless environments

## Environment Variables

### Backend Configuration

```bash
# Required in production
JWT_SECRET=your_random_jwt_secret_here_32plus_chars
SESSION_SECRET=your_random_session_secret_here_32plus_chars

# Optional (defaults shown)
JWT_EXPIRY=7d                    # Token expiry time
NODE_ENV=production              # Environment mode
```

### Frontend Configuration

```bash
VITE_API_URL=https://your-backend-url.com
```

## API Endpoints

### Authentication Endpoints

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback (returns JWT)
- `GET /api/auth/user` - Get current user (requires auth)
- `GET /api/auth/logout` - Logout user

### Protected Endpoints (Require Authentication)

All these endpoints require `Authorization: Bearer <token>` header:

- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `DELETE /api/expenses` - Delete all expenses

### Public Endpoints

- `GET /api/expenses` - List expenses
- `GET /api/groups` - List groups
- `GET /api/settlement` - Get settlement calculations
- `GET /api/settlement/optimized` - Get optimized settlements
- `GET /api/health` - Health check

## Testing Authentication

### Manual Testing with cURL

```bash
# 1. Get JWT token (after OAuth login, extract from URL hash)
TOKEN="your_jwt_token_here"

# 2. Make authenticated request
curl -X POST https://api.example.com/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paidBy": 1, "amount": 100, "description": "Test"}'

# 3. Get current user
curl https://api.example.com/api/auth/user \
  -H "Authorization: Bearer $TOKEN"
```

### Testing in Browser Console

```javascript
// Check if authenticated
const response = await fetch('/api/auth/user', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
const user = await response.json();
console.log(user);
```

## Migration Guide

### From Session-Only to JWT

The system maintains backwards compatibility. No migration needed for existing users:

1. Existing sessions continue to work
2. New logins receive JWT tokens
3. Both authentication methods accepted
4. Sessions gradually replaced as users re-login

### Deployment Steps

1. Deploy backend with JWT support
2. Set `JWT_SECRET` environment variable
3. Deploy frontend with token management
4. Users automatically receive tokens on next login
5. Monitor logs for any authentication issues

## Troubleshooting

### Token Not Working

1. **Check token exists**: `localStorage.getItem('auth_token')`
2. **Verify token format**: Should start with `eyJ`
3. **Check expiration**: Tokens expire after 7 days by default
4. **Verify header**: Must be `Authorization: Bearer <token>`

### Token Not Received After Login

1. **Check OAuth flow**: Ensure callback URL is correct
2. **Verify redirect**: Should redirect to frontend with `#token=...`
3. **Check console**: Look for JavaScript errors during token extraction
4. **Backend logs**: Check if token generation succeeded

### 401 Unauthorized Errors

1. **Token expired**: Re-login to get new token
2. **Invalid token**: Clear localStorage and re-login
3. **Missing token**: Check Authorization header is sent
4. **Backend error**: Check backend logs for JWT verification errors

## Best Practices

### For Developers

1. **Always use `authFetch`**: Don't manually add tokens to fetch calls
2. **Handle 401 errors**: Redirect to login on authentication failure
3. **Clear tokens on logout**: Call `removeToken()` when user logs out
4. **Secure token storage**: localStorage is acceptable but consider httpOnly cookies for enhanced security

### For Deployment

1. **Strong secrets**: Use cryptographically random 32+ character secrets
2. **HTTPS only**: Never transmit tokens over HTTP in production
3. **Monitor tokens**: Track token generation and validation in logs
4. **Rotate secrets**: Plan for secret rotation without downtime

## References

- [JWT.io](https://jwt.io/) - JWT standard documentation
- [OAuth 2.0](https://oauth.net/2/) - OAuth specification
- [Express Rate Limit](https://express-rate-limit.github.io/) - Rate limiting documentation
