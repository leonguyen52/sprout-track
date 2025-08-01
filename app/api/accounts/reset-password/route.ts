import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { hashPassword } from '../../utils/password-utils';
import { checkIpLockout, recordFailedAttempt, resetFailedAttempts } from '../../utils/ip-lockout';

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
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

function isValidPassword(password: string): boolean {
  // Password must be at least 8 characters and contain at least one letter and one number
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ResetPasswordResponse>>> {
  try {
    // Get the client IP for rate limiting
    const ip = getClientIP(req);
    
    // Check if the IP is locked out
    const { locked, remainingTime } = checkIpLockout(ip);
    if (locked) {
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${Math.ceil(remainingTime / 60000)} minutes.`,
        },
        { status: 429 }
      );
    }

    const { token, password }: ResetPasswordRequest = await req.json();

    // Validate input
    if (!token || !password) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: 'Reset token and new password are required',
        },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: 'Password must be at least 8 characters and contain both letters and numbers',
        },
        { status: 400 }
      );
    }

    // Find the account by reset token
    const account = await prisma.account.findUnique({
      where: { passwordResetToken: token }
    });

    if (!account) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    // Check if the reset token has expired
    if (!account.passwordResetExpires || account.passwordResetExpires < new Date()) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: 'Reset token has expired. Please request a new password reset.',
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the account with the new password and clear reset token
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      }
    });

    // Reset failed attempts on successful password reset
    resetFailedAttempts(ip);

    console.log(`Password reset successful for account: ${account.email}`);

    return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
      {
        success: true,
        data: {
          success: true,
          message: 'Password has been reset successfully. You can now log in with your new password.',
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    
    return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
      {
        success: false,
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to validate reset token (for the reset page)
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<{ valid: boolean; email?: string }>>> {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json<ApiResponse<{ valid: boolean }>>(
        {
          success: false,
          error: 'Reset token is required',
        },
        { status: 400 }
      );
    }

    // Find the account by reset token
    const account = await prisma.account.findUnique({
      where: { passwordResetToken: token },
      select: { 
        id: true, 
        email: true, 
        passwordResetExpires: true 
      }
    });

    if (!account) {
      return NextResponse.json<ApiResponse<{ valid: boolean }>>(
        {
          success: true,
          data: { valid: false }
        },
        { status: 200 }
      );
    }

    // Check if the reset token has expired
    const isExpired = !account.passwordResetExpires || account.passwordResetExpires < new Date();

    return NextResponse.json<ApiResponse<{ valid: boolean; email?: string }>>(
      {
        success: true,
        data: { 
          valid: !isExpired,
          email: isExpired ? undefined : account.email
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Token validation error:', error);
    
    return NextResponse.json<ApiResponse<{ valid: boolean }>>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}