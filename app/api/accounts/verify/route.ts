import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { sendWelcomeEmail } from '../../utils/account-emails';
import { generateSlug } from '../../utils/slug-generator';
import { hashPasswordSync } from '../../utils/password-utils';

interface EmailVerificationRequest {
  token: string;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
  familySlug?: string;
  redirectUrl?: string;
}

// Helper function to generate a random 6-digit PIN
function generateFamilyPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
        return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
          {
            success: false,
            error: 'Account verified but family setup incomplete. Please contact support.'
          },
          { status: 500 }
        );
      }
    }
    
    // Generate unique family slug
    let familySlug: string;
    let slugAttempts = 0;
    const maxSlugAttempts = 10;
    
    do {
      familySlug = generateSlug();
      const existingFamily = await prisma.family.findUnique({
        where: { slug: familySlug }
      });
      if (!existingFamily) break;
      slugAttempts++;
    } while (slugAttempts < maxSlugAttempts);
    
    if (slugAttempts >= maxSlugAttempts) {
      return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
        {
          success: false,
          error: 'Unable to generate unique family identifier. Please try again.'
        },
        { status: 500 }
      );
    }
    
    // Generate family PIN
    const familyPin = generateFamilyPin();
    const hashedPin = hashPasswordSync(familyPin);
    
    // Begin transaction to create family and update account
    const result = await prisma.$transaction(async (tx) => {
      // Create family
      const family = await tx.family.create({
        data: {
          slug: familySlug,
          name: 'My Family', // Default name, user can change later
          isActive: true,
          accountId: account.id
        }
      });
      
      // Create default settings for the family
      await tx.settings.create({
        data: {
          familyId: family.id,
          familyName: family.name,
          securityPin: hashedPin,
          defaultBottleUnit: 'OZ',
          defaultSolidsUnit: 'TBSP',
          defaultHeightUnit: 'IN',
          defaultWeightUnit: 'LB',
          defaultTempUnit: 'F',
          activitySettings: JSON.stringify({
            global: {
              order: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone', 'medicine'],
              visible: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone', 'medicine']
            }
          })
        }
      });
      
      // Create admin caretaker linked to the account
      const caretaker = await tx.caretaker.create({
        data: {
          loginId: '01', // Default admin login ID
          name: account.firstName || 'Account Owner',
          type: 'parent',
          role: 'ADMIN',
          inactive: false,
          securityPin: hashedPin, // Same PIN as family
          familyId: family.id,
          accountId: account.id
        }
      });
      
      // Update account to mark as verified and link to family/caretaker
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          verified: true,
          verificationToken: null, // Clear the token
          familyId: family.id,
          caretakerId: caretaker.id
        }
      });
      
      return { family, caretaker, account: updatedAccount };
    });
    
    console.log(`Account verified and family created: accountId=${account.id}, familySlug=${familySlug}`);
    
    // Send welcome email with family details
    try {
      await sendWelcomeEmail(
        account.email,
        account.firstName || 'User',
        familySlug,
        familyPin
      );
      console.log(`Welcome email sent to: ${account.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue - user is still successfully verified
    }
    
    return NextResponse.json<ApiResponse<EmailVerificationResponse>>({
      success: true,
      data: {
        success: true,
        message: 'Account verified successfully! Welcome to Sprout Track.',
        familySlug: familySlug,
        redirectUrl: `/${familySlug}`
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
      // Redirect to an error page or coming-soon page
      return NextResponse.redirect(new URL('/coming-soon?error=missing-token', req.url));
    }
    
    // Verify the token
    const account = await prisma.account.findUnique({
      where: { verificationToken: token },
      include: { family: true }
    });
    
    if (!account) {
      // Redirect to an error page
      return NextResponse.redirect(new URL('/coming-soon?error=invalid-token', req.url));
    }
    
    if (account.verified && account.family) {
      // Already verified, redirect to family dashboard
      return NextResponse.redirect(new URL(`/${account.family.slug}`, req.url));
    }
    
    // If not verified, redirect to a verification page that will call the POST endpoint
    return NextResponse.redirect(new URL(`/accounts/verify?token=${token}`, req.url));
    
  } catch (error) {
    console.error('Email verification GET error:', error);
    return NextResponse.redirect(new URL('/coming-soon?error=verification-failed', req.url));
  }
}