import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import jwt from 'jsonwebtoken';
import { checkIpLockout, recordFailedAttempt, resetFailedAttempts } from '../utils/ip-lockout';

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'baby-tracker-jwt-secret';
// Token expiration time in seconds (default to 12 hours if not specified)
const TOKEN_EXPIRATION = parseInt(process.env.AUTH_LIFE || '1800', 10);

// Authentication endpoint for caretakers or system PIN
export async function POST(req: NextRequest) {
  try {
    // Get the client IP
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    // Check if the IP is locked out
    const { locked, remainingTime } = checkIpLockout(ip);
    if (locked) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: `You have been locked out due to too many failed attempts. Please try again in ${Math.ceil(remainingTime / 60000)} minutes.`,
        },
        { status: 429 }
      );
    }

    const { loginId, securityPin, familySlug } = await req.json();

    if (!securityPin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Security PIN is required',
        },
        { status: 400 }
      );
    }

    // Validate family slug if provided
    let targetFamily = null;
    if (familySlug) {
      targetFamily = await prisma.family.findFirst({
        where: {
          slug: familySlug,
          isActive: true,
        },
      });

      if (!targetFamily) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: 'Invalid family',
          },
          { status: 404 }
        );
      }
    }

    // Count active caretakers (excluding system caretaker)
    const caretakerCount = await prisma.caretaker.count({
      where: {
        deletedAt: null,
        loginId: { not: '00' }, // Exclude system caretaker
      },
    });

    // If no caretakers exist, use system PIN from settings
    if (caretakerCount === 0) {
      // Check system PIN
      const settings = await prisma.settings.findFirst();
      
      if (settings && settings.securityPin === securityPin) {
        // Find the system caretaker to get family information
        const systemCaretaker = await prisma.caretaker.findFirst({
          where: {
            loginId: '00',
            deletedAt: null,
            // If family slug is provided, ensure system caretaker belongs to that family
            ...(targetFamily ? { familyId: targetFamily.id } : {}),
          },
          include: {
            family: true,
          },
        });
        
        if (systemCaretaker) {
          // Create JWT token for system admin with actual caretaker data
          const token = jwt.sign(
            {
              id: systemCaretaker.id,
              name: systemCaretaker.name,
              type: systemCaretaker.type,
              role: (systemCaretaker as any).role || 'ADMIN',
              familyId: systemCaretaker.familyId,
              familySlug: systemCaretaker.family?.slug,
            },
            JWT_SECRET,
            { expiresIn: `${TOKEN_EXPIRATION}s` } // Token expires based on AUTH_LIFE env variable
          );
          
          // Create response with token
          const response = NextResponse.json<ApiResponse<{ 
            id: string; 
            name: string; 
            type: string | null; 
            role: string;
            token: string;
            familyId: string | null;
            familySlug: string | null;
          }>>(
            {
              success: true,
              data: {
                id: systemCaretaker.id,
                name: systemCaretaker.name,
                type: systemCaretaker.type,
                role: (systemCaretaker as any).role || 'ADMIN',
                token: token,
                familyId: systemCaretaker.familyId,
                familySlug: systemCaretaker.family?.slug || null,
              },
            }
          );
          
          // Also set the caretakerId cookie for backward compatibility
          response.cookies.set('caretakerId', systemCaretaker.id, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: 'strict',
            maxAge: TOKEN_EXPIRATION, // Use AUTH_LIFE env variable
            path: '/',
          });
          
          // Reset failed attempts on successful login
          resetFailedAttempts(ip);
          
          return response;
        } else {
          // Fallback if system caretaker doesn't exist
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: 'System caretaker not found. Please contact administrator.',
            },
            { status: 500 }
          );
        }
      }
    } else if (loginId) {
      // If caretakers exist, require loginId and check caretaker credentials
      const caretaker = await prisma.caretaker.findFirst({
        where: {
          loginId: loginId,
          securityPin: securityPin,
          inactive: false,
          deletedAt: null,
          // If family slug is provided, ensure caretaker belongs to that family
          ...(targetFamily ? { familyId: targetFamily.id } : {}),
        } as any, // Type assertion for loginId field
        include: {
          family: true, // Include family information
        },
      });

      if (caretaker) {
        // Create JWT token for caretaker
        const token = jwt.sign(
          {
            id: caretaker.id,
            name: caretaker.name,
            type: caretaker.type,
            role: (caretaker as any).role || 'USER',
            familyId: caretaker.familyId,
            familySlug: caretaker.family?.slug,
          },
          JWT_SECRET,
          { expiresIn: `${TOKEN_EXPIRATION}s` } // Token expires based on AUTH_LIFE env variable
        );
        
        // Create response with token
        const response = NextResponse.json<ApiResponse<{ 
          id: string; 
          name: string; 
          type: string | null; 
          role: string;
          token: string;
          familyId: string | null;
          familySlug: string | null;
        }>>(
          {
            success: true,
            data: {
              id: caretaker.id,
              name: caretaker.name,
              type: caretaker.type,
              // Use type assertion for role until Prisma types are updated
              role: (caretaker as any).role || 'USER',
              token: token,
              familyId: caretaker.familyId,
              familySlug: caretaker.family?.slug || null,
            },
          }
        );
        
        // Also set the caretakerId cookie for backward compatibility
        response.cookies.set('caretakerId', caretaker.id, {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRATION, // Use AUTH_LIFE env variable
          path: '/',
        });
        
        // Reset failed attempts on successful login
        resetFailedAttempts(ip);
        
        return response;
      }
    }
    
    // If we get here, authentication failed
    // Record the failed attempt
    recordFailedAttempt(ip);
    
    // Provide a more specific error message if family validation failed
    const errorMessage = targetFamily 
      ? 'Invalid credentials or user does not have access to this family'
      : 'Invalid credentials';
    
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Authentication failed',
      },
      { status: 500 }
    );
  }
}
