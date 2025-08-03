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

// Note: Email verification now uses hash-based URLs (/#verify?token=...) 
// and is handled by the AccountModal component, so no GET handler needed.