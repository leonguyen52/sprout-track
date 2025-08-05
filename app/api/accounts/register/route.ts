import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { sendVerificationEmail } from '../../utils/account-emails';
import { hashPassword } from '../../utils/password-utils';

// Rate limiting for registration attempts
const registrationAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_REGISTRATION_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AccountRegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface AccountRegistrationResponse {
  success: boolean;
  message: string;
  requiresVerification: boolean;
}

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

function checkRegistrationRateLimit(ip: string): { allowed: boolean; remainingTime: number } {
  const now = Date.now();
  const attempt = registrationAttempts.get(ip);
  
  if (!attempt) {
    return { allowed: true, remainingTime: 0 };
  }
  
  // Reset if window has expired
  if (now > attempt.resetTime) {
    registrationAttempts.delete(ip);
    return { allowed: true, remainingTime: 0 };
  }
  
  // Check if limit exceeded
  if (attempt.count >= MAX_REGISTRATION_ATTEMPTS) {
    const remainingTime = Math.ceil((attempt.resetTime - now) / 1000 / 60); // minutes
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true, remainingTime: 0 };
}

function recordRegistrationAttempt(ip: string): void {
  const now = Date.now();
  const attempt = registrationAttempts.get(ip);
  
  if (!attempt || now > attempt.resetTime) {
    // First attempt or window expired
    registrationAttempts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
  } else {
    // Increment existing attempt
    attempt.count += 1;
    registrationAttempts.set(ip, attempt);
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password: string): boolean {
  // Minimum 8 characters, lowercase, uppercase, numbers, and special characters
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false; // lowercase
  if (!/[A-Z]/.test(password)) return false; // uppercase
  if (!/[0-9]/.test(password)) return false; // numbers
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) return false; // SQL-safe special characters
  return true;
}

function generateVerificationToken(): string {
  // Generate a 6-digit hex key (3 bytes = 6 hex characters)
  return randomBytes(3).toString('hex');
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<AccountRegistrationResponse>>> {
  try {
    const ip = getClientIP(req);
    
    // Check rate limiting
    const rateLimitCheck = checkRegistrationRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      console.log(`Registration rate limit exceeded for IP: ${ip}, remaining time: ${rateLimitCheck.remainingTime} minutes`);
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: `Too many registration attempts. Please try again in ${rateLimitCheck.remainingTime} minutes.`
        },
        { status: 429 }
      );
    }
    
    const body: AccountRegistrationRequest = await req.json();
    const { email, password, firstName, lastName } = body;
    
    // Validate required fields
    if (!email || !password || !firstName) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: 'Email, password, and first name are required'
        },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: 'Please provide a valid email address'
        },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: 'Password must be at least 8 characters and include lowercase & uppercase letters, numbers, and special characters (!@#$%^&*()_+-=[]{}|;:,.<>?)'
        },
        { status: 400 }
      );
    }
    
    // Validate names
    if (firstName.trim().length < 1) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: 'First name must not be empty'
        },
        { status: 400 }
      );
    }
    
    // Record this registration attempt
    recordRegistrationAttempt(ip);
    
    // Check if email already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    if (existingAccount) {
      console.log(`Registration attempt with existing email: ${email}`);
      // For security, don't reveal that email exists
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>({
        success: true,
        data: {
          success: true,
          message: 'Registration successful! Please check your email for verification instructions.',
          requiresVerification: true
        }
      });
    }
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Check if beta mode is enabled
    const isBetaEnabled = process.env.BETA === '1';
    
    // Create account (unverified)
    const account = await prisma.account.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        verified: false,
        verificationToken,
        betaparticipant: isBetaEnabled,
        provider: 'email'
      }
    });
    
    console.log(`Created unverified account for email: ${email}, accountId: ${account.id}`);
    
    // Send verification email
    try {
      await sendVerificationEmail(account.email, verificationToken, account.firstName || 'User');
      console.log(`Verification email sent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with success response - user can request resend later
    }
    
    return NextResponse.json<ApiResponse<AccountRegistrationResponse>>({
      success: true,
      data: {
        success: true,
        message: 'Registration successful! Please check your email for verification instructions.',
        requiresVerification: true
      }
    });
    
  } catch (error) {
    console.error('Account registration error:', error);
    return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
      {
        success: false,
        error: 'Registration failed. Please try again later.'
      },
      { status: 500 }
    );
  }
}
