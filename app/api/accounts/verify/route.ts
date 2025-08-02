import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
// No longer need these imports since we're not creating families

interface EmailVerificationRequest {
  token: string;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
  familySlug?: string;
  redirectUrl?: string;
}

// Helper functions removed since we're not creating families during verification

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<EmailVerificationResponse>>> {
  try {
    const body: EmailVerificationRequest = await req.json();
    const { token } = body;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
        {
          success: false,
          error: 'Verification token is required'
        },
        { status: 400 }
      );
    }
    
    // Find account with this verification token
    const account = await prisma.account.findUnique({
      where: { verificationToken: token },
      include: { family: true }
    });
    
    if (!account) {
      return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
        {
          success: false,
          error: 'Invalid or expired verification token'
        },
        { status: 404 }
      );
    }
    
    if (account.verified) {
      // Account already verified, redirect to family if it exists
      if (account.family) {
        return NextResponse.json<ApiResponse<EmailVerificationResponse>>({
          success: true,
          data: {
            success: true,
            message: 'Account already verified. Redirecting to your family dashboard.',
            familySlug: account.family.slug,
            redirectUrl: `/${account.family.slug}`
          }
        });
      } else {
        // Account verified but no family - redirect to coming soon page
        return NextResponse.json<ApiResponse<EmailVerificationResponse>>({
          success: true,
          data: {
            success: true,
            message: 'Account already verified. You can now set up your family.',
            redirectUrl: '/coming-soon'
          }
        });
      }
    }
    
    // Simply verify the account without creating family
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        verified: true,
        verificationToken: null, // Clear the token
      }
    });
    
    console.log(`Account verified: accountId=${account.id}, email=${account.email}`);
    
    return NextResponse.json<ApiResponse<EmailVerificationResponse>>({
      success: true,
      data: {
        success: true,
        message: 'Account verified successfully! You can now set up your family.',
        redirectUrl: '/coming-soon'
      }
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
      {
        success: false,
        error: 'Verification failed. Please try again or contact support.'
      },
      { status: 500 }
    );
  }
}

// GET handler for verification links clicked from email
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    if (!token) {
      // Redirect to verification page with error
      return NextResponse.redirect(new URL('/accounts/verify?error=missing-token', req.url));
    }
    
    // Check if account exists and verification status
    const account = await prisma.account.findUnique({
      where: { verificationToken: token },
      include: { family: true }
    });
    
    if (!account) {
      // Redirect to verification page with error
      return NextResponse.redirect(new URL('/accounts/verify?error=invalid-token', req.url));
    }
    
    if (account.verified) {
      if (account.family) {
        // Already verified and has family, redirect to family dashboard
        return NextResponse.redirect(new URL(`/${account.family.slug}`, req.url));
      } else {
        // Already verified but no family, redirect to coming soon page
        return NextResponse.redirect(new URL('/coming-soon', req.url));
      }
    }
    
    // If not verified, redirect to verification page to handle the process
    return NextResponse.redirect(new URL(`/accounts/verify?token=${token}`, req.url));
    
  } catch (error) {
    console.error('Email verification GET error:', error);
    return NextResponse.redirect(new URL('/accounts/verify?error=verification-failed', req.url));
  }
}