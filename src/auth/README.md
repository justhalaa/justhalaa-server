# Authentication System Documentation

## Overview

This authentication system implements a robust JWT-based authentication with both access and refresh tokens, following security best practices.

## Features

- **Dual Token System**: Short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days)
- **Refresh Token Rotation**: Automatic rotation of refresh tokens on each refresh
- **Secure Storage**: Refresh tokens stored as HTTP-only cookies
- **Token Revocation**: Support for logout and logout-all functionality
- **Security Headers**: Proper cookie security flags for production
- **OTP Verification**: Email-based OTP verification for login

## Token Structure

### Access Token

- **Lifetime**: 15 minutes
- **Storage**: Client-side (memory/localStorage)
- **Usage**: Authorization header for API requests
- **Format**: `Bearer <access_token>`

### Refresh Token

- **Lifetime**: 7 days
- **Storage**: HTTP-only cookie (secure)
- **Usage**: Automatic refresh of access tokens
- **Rotation**: New refresh token issued on each refresh

## API Endpoints

### Authentication Flow

1. **Register User**

   ```
   POST /auth/create-user
   ```

2. **Login (Send OTP)**

   ```
   POST /auth/login
   Body: { "email": "user@example.com" }
   ```

3. **Verify OTP & Get Tokens**
   ```
   POST /auth/verify-otp
   Body: { "email": "user@example.com", "otp": "123456" }
   Response: {
     "success": true,
     "data": {
       "accessToken": "eyJ...",
       "refreshToken": "rt_...",
       "expiresIn": 900,
       "tokenType": "Bearer"
     }
   }
   ```

### Token Management

4. **Refresh Tokens**

   ```
   POST /auth/refresh
   Cookie: refreshToken=rt_...
   OR
   Body: { "refreshToken": "rt_..." }
   ```

5. **Logout**

   ```
   POST /auth/logout
   Headers: Authorization: Bearer <access_token>
   ```

6. **Logout All Devices**
   ```
   POST /auth/logout-all
   Headers: Authorization: Bearer <access_token>
   ```

### User Information

7. **Get Current User**

   ```
   GET /auth/me
   Headers: Authorization: Bearer <access_token>
   ```

8. **Get User by ID**
   ```
   GET /auth/user/:id
   Headers: Authorization: Bearer <access_token>
   ```

## Security Features

### Cookie Security

- `httpOnly`: Prevents XSS attacks
- `secure`: HTTPS only in production
- `sameSite: 'strict'`: CSRF protection
- `path: '/auth/refresh'`: Restricts cookie scope

### Token Security

- Access tokens are short-lived (15 minutes)
- Refresh tokens are rotated on each use
- All user tokens can be revoked on logout-all
- Expired tokens are automatically cleaned up

## Environment Variables

Add these to your `.env` file:

```env
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
# Fallback to JWT_SECRET if the above are not set
JWT_SECRET=your_fallback_secret_here
```

## Usage in Controllers

### Protecting Routes

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get('data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProtectedData(@Req() req: Request) {
    const user = req['user']; // Contains: { sub, id, email, type }
    return { message: 'This is protected data', user };
  }
}
```

### Global Authentication

To protect all routes by default, add to `app.module.ts`:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

## Client-Side Implementation

### JavaScript/TypeScript Example

```typescript
class AuthService {
  private accessToken: string | null = null;

  async login(email: string, otp: string) {
    const response = await fetch('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include', // Important for cookies
    });

    const data = await response.json();
    if (data.success) {
      this.accessToken = data.data.accessToken;
      // Refresh token is automatically stored as HTTP-only cookie
    }
    return data;
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${this.accessToken}`,
          },
          credentials: 'include',
        });
      }
    }

    return response;
  }

  async refreshToken() {
    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        this.accessToken = data.data.accessToken;
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  async logout() {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      credentials: 'include',
    });
    this.accessToken = null;
  }
}
```

## Database Schema

The system creates a `refresh_tokens` table with the following structure:

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR UNIQUE NOT NULL,
  userId INTEGER NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  isRevoked BOOLEAN DEFAULT FALSE,
  revokedAt TIMESTAMP NULL,
  replacedByToken VARCHAR NULL,
  userAgent VARCHAR NULL,
  ipAddress VARCHAR NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## Migration Notes

### From Single Token to Dual Token

If upgrading from a single JWT token system:

1. Update client applications to handle the new token structure
2. Implement token refresh logic on the client side
3. Update API calls to include credentials for cookie support
4. Test the new authentication flow thoroughly

### Backward Compatibility

The system maintains some backward compatibility:

- Old JWT_SECRET environment variable is used as fallback
- Token response includes both tokens for gradual migration

## Troubleshooting

### Common Issues

1. **Cookies not being set**: Ensure `credentials: 'include'` in fetch requests
2. **CORS issues**: Configure CORS to allow credentials
3. **Token refresh fails**: Check cookie path and domain settings
4. **Unauthorized errors**: Verify JWT secrets are correctly set

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will log token operations and help identify issues.
