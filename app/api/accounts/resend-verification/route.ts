import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { sendVerificationEmail } from '../../utils/account-emails';

interface ResendVerificationRequest {
  email: string;
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

// Rate limiting for resend attempts
const resendAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_RESEND_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function checkResendRateLimit(ip: string): { allowed: boolean; remainingTime: number } {
  const now = Date.now();
  const attempt = resendAttempts.get(ip);
  
  if (!attempt) {
    return { allowed: true, remainingTime: 0 };
  }
  
  // Reset if window has expired
  if (now > attempt.resetTime) {
    resendAttempts.delete(ip);
    return { allowed: true, remainingTime: 0 };
  }
  
  // Check if limit exceeded
  if (attempt.count >= MAX_RESEND_ATTEMPTS) {
    const remainingTime = Math.ceil((attempt.resetTime - now) / 1000 / 60); // minutes
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true, remainingTime: 0 };
}

function recordResendAttempt(ip: string): void {
  const now = Date.now();
  const attempt = resendAttempts.get(ip);
  
  if (!attempt || now > attempt.resetTime) {
    // First attempt or window expired
    resendAttempts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
  } else {
    // Increment existing attempt
    attempt.count += 1;
    resendAttempts.set(ip, attempt);
  }
}

function generateVerificationToken(): string {
  // Generate a 6-digit hex key (3 bytes = 6 hex characters)
  return randomBytes(3).toString('hex');
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ResendVerificationResponse>>> {
  try {
    const ip = getClientIP(req);
    
    // Check rate limiting
    const rateLimitCheck = checkResendRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      console.log(`Resend verification rate limit exceeded for IP: ${ip}, remaining time: ${rateLimitCheck.remainingTime} minutes`);
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>(
        {
          success: false,
          error: `Too many resend attempts. Please try again in ${rateLimitCheck.remainingTime} minutes.`
        },
        { status: 429 }
      );
    }
    
    const body: ResendVerificationRequest = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>(
        {
          success: false,
          error: 'Email is required'
        },
        { status: 400 }
      );
    }
    
    // Record this resend attempt
    recordResendAttempt(ip);
    
    // Find account by email
    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    // For security, always return success even if account doesn't exist
    if (!account) {
      console.log(`Resend verification request for non-existent email: ${email}`);
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>({
        success: true,
        data: {
          success: true,
          message: 'If an account with that email exists and is not yet verified, a new verification email has been sent.'
        }
      });
    }
    
    // If already verified, return success but don't send email
    if (account.verified) {
      console.log(`Resend verification request for already verified account: ${email}`);
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>({
        success: true,
        data: {
          success: true,
          message: 'If an account with that email exists and is not yet verified, a new verification email has been sent.'
        }
      });
    }
    
    // Generate new verification token
    const verificationToken = generateVerificationToken();
    
    // Update account with new token
    await prisma.account.update({
      where: { id: account.id },
      data: {
        verificationToken
      }
    });
    
    console.log(`Updated verification token for account: ${email}, accountId: ${account.id}`);
    
    // Send verification email
    try {
      await sendVerificationEmail(account.email, verificationToken, account.firstName || 'User');
      console.log(`Verification email resent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with success response - user can try again later
    }
    
    return NextResponse.json<ApiResponse<ResendVerificationResponse>>({
      success: true,
      data: {
        success: true,
        message: 'If an account with that email exists and is not yet verified, a new verification email has been sent.'
      }
    });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json<ApiResponse<ResendVerificationResponse>>(
      {
        success: false,
        error: 'Failed to resend verification email. Please try again later.'
      },
      { status: 500 }
    );
  }
}