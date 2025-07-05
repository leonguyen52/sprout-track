# Baby Tracker API Authentication

This document describes the authentication system used in the Baby Tracker application and provides guidelines for implementing authentication in API routes.

## Overview

The Baby Tracker application uses a JWT-based authentication system with two levels of access:

1. **User Authentication**: Regular authenticated users who can access most application features
2. **Admin Authentication**: Admin users who have elevated privileges for certain operations

Authentication is managed through JWT tokens stored in localStorage with fallback support for HTTP-only cookies (for backward compatibility). The system is implemented using middleware functions that wrap API route handlers.

## Authentication Flow

1. Users authenticate through the `/api/auth` endpoint by providing their login ID and security PIN
2. Upon successful authentication, the server:
   - Generates a JWT token containing the user's ID, name, type, role, family ID, and family slug
   - Returns the token and user information to the client
3. The client stores the JWT token in localStorage as `authToken`
4. All subsequent API requests include the token in the Authorization header (`Bearer <token>`)
5. API routes use middleware functions to verify the token before processing requests
6. When a user logs out, the token is invalidated by adding it to a server-side blacklist

### System Authentication for Families Without Caretakers

For families that have no regular caretakers (excluding system caretakers), the system uses a special authentication flow:

1. When no caretakers exist for a family, the system checks the family's settings PIN
2. If the PIN matches, the system automatically creates or uses a system caretaker (loginId '00') for that family
3. System caretakers are created on-demand during authentication if they don't exist
4. Family settings are also created on-demand with default values if they don't exist
5. This ensures every family has both settings and a system caretaker for authentication purposes

### System Caretaker Security Lockout

To prevent unauthorized access through the default system account, the following security measure is implemented:

- **Once regular caretakers are configured for a family, the system caretaker (loginId '00') is automatically disabled**
- This prevents anyone from using the default system PIN to access a family that has real users
- The system caretaker can only be used when **no other caretakers exist** for the family
- Attempts to login with the system caretaker when regular caretakers exist will result in a `403 - System account access is disabled when caretakers are configured` error
- This security measure applies per family - if Family A has caretakers but Family B doesn't, the system caretaker is only disabled for Family A

### System Administrator Authentication

System administrators have elevated permissions across the entire application:

1. Authenticate using the system admin password through `/api/auth` with `adminPassword` field
2. Receive a JWT token with `isSysAdmin: true` flag
3. Can access family-specific routes by providing `familyId` parameter
4. Can create, manage, and access any family in the system
5. Have admin-level access to all `withAdminAuth` protected routes

## Authentication Utilities

The authentication system is centralized in `/app/api/utils/auth.ts` and provides the following utilities:

### Functions

- `verifyAuthentication(req)`: Checks if a request is authenticated
- `getAuthenticatedUser(req)`: Retrieves authenticated user information from a request
- `invalidateToken(token)`: Adds a token to the blacklist to invalidate it

### Middleware

- `withAuth(handler)`: Middleware that ensures a request is authenticated
- `withAdminAuth(handler)`: Middleware that ensures a request is from an admin user
- `withAuthContext(handler)`: Middleware that provides auth context to the handler

## Implementing Authentication in API Routes

### Regular User Authentication

For routes that should be accessible to any authenticated user:

```typescript
import { withAuth, ApiResponse } from '../utils/auth';

async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  // Your handler logic here
  return NextResponse.json({ success: true, data: result });
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
```

The client should include the JWT token in the Authorization header:

```typescript
const token = localStorage.getItem('authToken');
const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Admin-Only Authentication

For routes that should only be accessible to admin users, system administrators, or system caretakers:

```typescript
import { withAdminAuth, ApiResponse } from '../utils/auth';

async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  // Your handler logic here
  return NextResponse.json({ success: true, data: result });
}

export const GET = withAdminAuth(handler);
export const POST = withAdminAuth(handler);
```

The `withAdminAuth` middleware allows access for:
- Users with `caretakerRole: 'ADMIN'`
- System caretakers (loginId '00')
- System administrators (`isSysAdmin: true`)

### Accessing User Information

If you need to access the authenticated user's information in your handler:

```typescript
import { withAuthContext, ApiResponse, AuthResult } from '../utils/auth';

async function handler(req: NextRequest, authContext: AuthResult): Promise<NextResponse<ApiResponse<any>>> {
  // Access user information from authContext
  const { caretakerId, caretakerType, caretakerRole, familyId, familySlug } = authContext;
  
  // Your handler logic here
  return NextResponse.json({ success: true, data: result });
}

export const GET = withAuthContext(handler);
export const POST = withAuthContext(handler);
```

## Authentication Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Logout Process

The logout process involves the following steps:

1. The client calls the `/api/auth/logout` endpoint with the JWT token in the Authorization header
2. The server adds the token to a blacklist to invalidate it immediately
3. The server clears any authentication cookies (for backward compatibility)
4. The client removes the token and other authentication data from localStorage

```typescript
// Client-side logout example
async function logout() {
  const token = localStorage.getItem('authToken');
  
  // Call the logout API
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  
  // Clear client-side auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('unlockTime');
  localStorage.removeItem('caretakerId');
  
  // Reset application state
  // ...
}
```

## Authentication Errors

Authentication errors return appropriate HTTP status codes:

- **401 Unauthorized**: When a user is not authenticated
- **403 Forbidden**: When a user is authenticated but lacks sufficient permissions

## Family-Level Authorization

The most critical security principle in this application is ensuring a user can **only** access data belonging to their own family. This is enforced by embedding the user's `familyId` into their JWT upon login, creating a trusted, server-side authentication context.

### The Golden Rule: Never Trust Client-Sent Family Context

API endpoints **must not** use any family ID or slug information sent from the client (e.g., in URL parameters, request bodies, or headers). The only source of truth for the user's family is the `familyId` provided in the `authContext` object by the `withAuthContext` middleware. Relying on client-provided data will lead to security vulnerabilities.

### Implementing Secure, Family-Aware API Endpoints

All API endpoints that handle family-specific data must use the `withAuthContext` middleware and follow the patterns below.

#### 1. Verifying User's Family Context
Before any other logic, check that the authenticated user belongs to a family.

```typescript
import { withAuthContext, ApiResponse, AuthResult } from '../utils/auth';

async function handler(req: NextRequest, authContext: AuthResult): Promise<NextResponse<ApiResponse<any>>> {
  const { familyId: userFamilyId } = authContext;

  if (!userFamilyId) {
    return NextResponse.json({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
  }

  // ... proceed with handler logic
}
```

#### 2. Authorizing Read, Update, and Delete Operations
For any request that targets a specific resource by its ID, you must first fetch the resource and verify it belongs to the user's family before proceeding.

**Example: `GET /api/bath-log?id={logId}`**
```typescript
// ... inside handler after getting userFamilyId

const { searchParams } = new URL(req.url);
const logId = searchParams.get('id');

const log = await prisma.bathLog.findUnique({ where: { id: logId } });

if (!log || log.familyId !== userFamilyId) {
  return NextResponse.json({ success: false, error: 'Log not found or access denied.' }, { status: 404 });
}

// Now it's safe to return the log
return NextResponse.json({ success: true, data: log });
```
This pattern must be used for `GET` (by ID), `PUT`, and `DELETE` handlers.

#### 3. Authorizing Create Operations
For requests that create a new resource linked to a parent (e.g., a `DiaperLog` for a `Baby`), you must verify the parent resource belongs to the user's family.

**Example: `POST /api/diaper-log`**
```typescript
// ... inside handler after getting userFamilyId

const { babyId, ...otherData } = await req.json();

const baby = await prisma.baby.findFirst({
  where: { id: babyId, familyId: userFamilyId }
});

if (!baby) {
  return NextResponse.json({ success: false, error: 'Baby not found in this family.' }, { status: 404 });
}

// Now it's safe to create the log, ensuring you set the familyId
const newLog = await prisma.diaperLog.create({
  data: {
    ...otherData,
    babyId: baby.id,
    familyId: userFamilyId // Explicitly set the family from the trusted context
  }
});

return NextResponse.json({ success: true, data: newLog });
```

#### 4. Authorizing List Operations
For requests that return a list of resources, always add a `where` clause to filter by the `userFamilyId` from the authentication context.

**Example: `GET /api/note`**
```typescript
// ... inside handler after getting userFamilyId

const notes = await prisma.note.findMany({
  where: {
    familyId: userFamilyId, // This is the crucial filter
    // ... other filters from query params
  },
  orderBy: { time: 'desc' }
});

return NextResponse.json({ success: true, data: notes });
```

## Security Considerations

1. **Cookie Security**:
   - HTTP-only: Prevents JavaScript access to the cookie
   - Secure: Only sent over HTTPS when `COOKIE_SECURE` environment variable is set to `"true"`
   - SameSite: Strict to prevent CSRF attacks
   - Limited expiration: 30 minutes
   - The `COOKIE_SECURE` environment variable (in `.env` file) controls whether cookies require HTTPS:
     - Set to `"false"` (default) to allow cookies on non-HTTPS connections
     - Set to `"true"` when you have an SSL certificate in place and want to enforce secure cookies

2. **Session Management**:
   - Two separate timeout mechanisms are implemented:
     1. **Token Expiration**: JWT tokens expire after a period defined by the AUTH_LIFE environment variable
     2. **Idle Timeout**: Users are logged out after a period of inactivity defined by the IDLE_TIME environment variable
   - Both values are stored in seconds and can be configured in the .env file
   - The system automatically logs users out when either the token expires or the idle timeout is reached

3. **Lockout Protection**:
   - Three failed login attempts trigger a server-side IP-based 5-minute lockout
   - This prevents automated attacks from bypassing client-side lockout mechanisms
   - IP lockout functionality is implemented in `/app/api/utils/ip-lockout.ts` and provides:
     - `checkIpLockout(ip)`: Checks if an IP is currently locked out
     - `recordFailedAttempt(ip)`: Records a failed login attempt for an IP
     - `resetFailedAttempts(ip)`: Resets failed attempts for an IP after successful login
   - The lockout system is used in the authentication process to prevent brute force attacks

4. **System Account Protection**:
   - System caretaker accounts (loginId '00') are automatically disabled when regular caretakers exist for a family
   - This prevents unauthorized access using default system credentials after a family has been properly configured
   - Failed attempts to use disabled system accounts are logged and count toward IP lockout limits
   - Each family's system account is independently managed - configuring caretakers in one family doesn't affect others

## Best Practices

1. **Always use the provided middleware**:
   - Don't implement custom authentication checks
   - Use `withAuth` for regular user access
   - Use `withAdminAuth` for admin-only access

2. **Handle errors gracefully**:
   - Provide clear error messages
   - Don't expose sensitive information in errors

3. **Test authentication thoroughly**:
   - Test with valid credentials
   - Test with invalid credentials
   - Test with expired sessions
   - Test with insufficient permissions

4. **Keep authentication logic centralized**:
   - Add new authentication features to the auth utility
   - Don't duplicate authentication logic across routes
