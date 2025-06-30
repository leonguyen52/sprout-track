import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import jwt from 'jsonwebtoken';

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'baby-tracker-jwt-secret';

// In-memory token blacklist (in a production app, this would be in Redis or similar)
// This is a simple Map that stores invalidated tokens with their expiry time
const tokenBlacklist = new Map<string, number>();

// Clean up expired tokens from the blacklist every hour
setInterval(() => {
  const now = Date.now();
  // Use Array.from to avoid TypeScript iterator issues
  Array.from(tokenBlacklist.entries()).forEach(([token, expiry]) => {
    if (now > expiry) {
      tokenBlacklist.delete(token);
    }
  });
}, 60 * 60 * 1000); // 1 hour

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Authentication result with caretaker information
 */
export interface AuthResult {
  authenticated: boolean;
  caretakerId?: string | null;
  caretakerType?: string | null;
  caretakerRole?: string;
  familyId?: string | null;
  familySlug?: string | null;
  isSysAdmin?: boolean;
  error?: string;
}

/**
 * Verifies if the request is from an authenticated user by checking cookies
 * @param req The Next.js request object
 * @returns A boolean indicating if the user is authenticated
 */
export async function verifyAuthentication(req: NextRequest): Promise<boolean> {
  const authResult = await getAuthenticatedUser(req);
  return authResult.authenticated;
}

/**
 * Gets the authenticated user information from the request
 * @param req The Next.js request object
 * @returns Authentication result with caretaker information
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthResult> {
  try {
    // First try to get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    // If no token in header, try to get caretakerId from cookies (backward compatibility)
    const caretakerId = req.cookies.get('caretakerId')?.value;
    
    // If we have a JWT token, verify it
    if (token) {
      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        return { authenticated: false, error: 'Token has been invalidated' };
      }
      
      try {
        // Verify and decode the token
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string;
          name: string;
          type: string | null;
          role: string;
          familyId: string | null;
          familySlug: string | null;
          isSysAdmin?: boolean;
        };
        
        // Return authenticated user info from token
        return {
          authenticated: true,
          caretakerId: decoded.isSysAdmin ? null : decoded.id,
          caretakerType: decoded.type,
          caretakerRole: decoded.role,
          familyId: decoded.familyId,
          familySlug: decoded.familySlug,
          isSysAdmin: decoded.isSysAdmin || false,
        };
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        return { authenticated: false, error: 'Invalid or expired token' };
      }
    }
    
    // If no token but we have a caretakerId cookie, use the old method (backward compatibility)
    if (caretakerId) {
      // Verify caretaker exists in database
      const caretaker = await prisma.caretaker.findFirst({
        where: {
          id: caretakerId,
          deletedAt: null,
        },
        include: {
          family: true,
        },
      });
      
      if (caretaker) {
        return { 
          authenticated: true, 
          caretakerId: caretaker.id,
          caretakerType: caretaker.type,
          // Use type assertion for role until Prisma types are updated
          caretakerRole: (caretaker as any).role || 'USER',
          familyId: caretaker.familyId,
          familySlug: caretaker.family?.slug,
          isSysAdmin: false,
        };
      }
    }
    
    return { authenticated: false, error: 'No valid authentication found' };
  } catch (error) {
    console.error('Authentication verification error:', error);
    return { authenticated: false, error: 'Authentication verification failed' };
  }
}

/**
 * Middleware function to require authentication for API routes
 * @param handler The API route handler function
 * @returns A wrapped handler that checks authentication before proceeding
 */
export function withAuth<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
}

/**
 * Middleware function to require admin authentication for API routes
 * @param handler The API route handler function
 * @returns A wrapped handler that checks admin authentication before proceeding
 */
export function withAdminAuth<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // Check if user is an admin by role or if they're a system caretaker
    let isSystemCaretaker = false;
    if (authResult.caretakerId) {
      try {
        const caretaker = await prisma.caretaker.findFirst({
          where: {
            id: authResult.caretakerId,
            loginId: '00', // System caretakers have loginId '00'
            deletedAt: null,
          },
        });
        isSystemCaretaker = !!caretaker;
      } catch (error) {
        console.error('Error checking system caretaker:', error);
      }
    }
    
    if (authResult.caretakerRole !== 'ADMIN' && !isSystemCaretaker) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      );
    }
    
    return handler(req);
  };
}

/**
 * Middleware function to require system admin authentication for API routes
 * @param handler The API route handler function
 * @returns A wrapped handler that checks system admin authentication before proceeding
 */
export function withSysAdminAuth<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // Check if user is a system administrator
    if (!authResult.isSysAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'System administrator access required',
        },
        { status: 403 }
      );
    }
    
    return handler(req);
  };
}

/**
 * Middleware function to attach authenticated user info to the request context
 * This allows handlers to access the authenticated user's information
 * @param handler The API route handler function that receives auth context
 * @returns A wrapped handler with authentication check
 */
export function withAuthContext<T>(
  handler: (req: NextRequest, authContext: AuthResult) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // System administrators: extract family context from URL, query params, or referer
    if (authResult.isSysAdmin) {
      // Try to get familyId from query parameter first
      const { searchParams } = new URL(req.url);
      let familyId = searchParams.get('familyId');
      
      // If no familyId in query params, try to extract from URL path (for family-specific routes like /[slug]/...)
      if (!familyId) {
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        
        // Check if this looks like a family route (not api, family-manager, etc.)
        if (pathSegments.length > 0 && 
            !pathSegments[0].startsWith('api') && 
            !pathSegments[0].startsWith('family-manager') &&
            !pathSegments[0].startsWith('setup')) {
          
          const familySlug = pathSegments[0];
          
          // Look up family by slug to get familyId
          try {
            const family = await prisma.family.findUnique({
              where: { slug: familySlug }
            });
            
            if (family) {
              familyId = family.id;
            }
          } catch (error) {
            console.error('Error looking up family by slug for sysadmin:', error);
          }
        }
      }
      
      // If still no familyId, try to extract from referer header (for API calls from family pages)
      if (!familyId) {
        const referer = req.headers.get('referer');
        if (referer) {
          try {
            const refererUrl = new URL(referer);
            const refererPathSegments = refererUrl.pathname.split('/').filter(Boolean);
            
            // Check if referer is a family route
            if (refererPathSegments.length > 0 && 
                !refererPathSegments[0].startsWith('api') && 
                !refererPathSegments[0].startsWith('family-manager') &&
                !refererPathSegments[0].startsWith('setup')) {
              
              const familySlug = refererPathSegments[0];
              
              // Look up family by slug to get familyId
              const family = await prisma.family.findUnique({
                where: { slug: familySlug }
              });
              
              if (family) {
                familyId = family.id;
              }
            }
          } catch (error) {
            console.error('Error parsing referer for sysadmin family context:', error);
          }
        }
      }
      
      // Create modified auth result with the family context
      const modifiedAuthResult = {
        ...authResult,
        familyId: familyId || authResult.familyId
      };
      
      return handler(req, modifiedAuthResult);
    }
    
    // Check if this is a system caretaker by looking up loginId in database
    if (authResult.caretakerId) {
      try {
        const caretaker = await prisma.caretaker.findFirst({
          where: {
            id: authResult.caretakerId,
            loginId: '00', // System caretakers have loginId '00'
            deletedAt: null,
          },
        });
        
        if (caretaker) {
          // This is a system caretaker - set caretakerId to null for database operations
          const modifiedAuthResult = {
            ...authResult,
            caretakerId: null
          };
          return handler(req, modifiedAuthResult);
        }
      } catch (error) {
        console.error('Error checking system caretaker:', error);
      }
    }
    
    return handler(req, authResult);
  };
}

/**
 * Invalidates a JWT token by adding it to the blacklist
 * @param token The JWT token to invalidate
 * @returns True if the token was successfully invalidated
 */
export function invalidateToken(token: string): boolean {
  try {
    // Decode the token without verification to get expiry
    const decoded = jwt.decode(token) as { exp?: number };
    
    if (decoded && decoded.exp) {
      // Store the token in the blacklist until its original expiry time
      const expiryMs = decoded.exp * 1000; // Convert seconds to milliseconds
      tokenBlacklist.set(token, expiryMs);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error invalidating token:', error);
    return false;
  }
}
