import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { checkIpLockout, recordFailedAttempt, resetFailedAttempts } from '../../utils/ip-lockout';
import { sendPasswordResetEmail } from '../../utils/account-emails';
import crypto from 'crypto';

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateResetToken(): string {
  // Generate a random 32-character hex string
  return crypto.randomBytes(16).toString('hex');
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ForgotPasswordResponse>>> {
  try {
    // Get the client IP for rate limiting
    const ip = getClientIP(req);
    
    // Check if the IP is locked out
    const { locked, remainingTime } = checkIpLockout(ip);
    if (locked) {
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${Math.ceil(remainingTime / 60000)} minutes.`,
        },
        { status: 429 }
      );
    }

    const { email }: ForgotPasswordRequest = await req.json();

    // Validate input
    if (!email) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error: 'Please enter a valid email address',
        },
        { status: 400 }
      );
    }

    // Find the account by email
    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase() }
    });

    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (!account) {
      // Still record as a failed attempt to prevent abuse
      recordFailedAttempt(ip);
      
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: true,
          data: {
            success: true,
            message: 'If an account with that email exists, we\'ve sent password reset instructions.',
          }
        },
        { status: 200 }
      );
    }

    // Check if account is verified
    if (!account.verified) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error: 'Account is not verified. Please verify your email first.',
        },
        { status: 400 }
      );
    }

    // Generate reset token and expiration (15 minutes from now)
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update account with reset token
    await prisma.account.update({
      where: { id: account.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      }
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(
        account.email, 
        resetToken, 
        account.firstName || 'User'
      );
      console.log(`Password reset email sent to: ${account.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email sending fails
      // The token is still valid for 15 minutes
    }

    // Reset failed attempts on successful request
    resetFailedAttempts(ip);

    return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
      {
        success: true,
        data: {
          success: true,
          message: 'If an account with that email exists, we\'ve sent password reset instructions.',
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
      {
        success: false,
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}