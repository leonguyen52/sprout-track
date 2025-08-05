import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { getAuthenticatedUser } from '../../utils/auth';
import { verifyPassword } from '../../utils/password-utils';
import { sendAccountClosureEmail } from '../../utils/account-emails';

interface CloseAccountResponse {
  success: boolean;
  message: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<CloseAccountResponse>>> {
  try {
    // Verify authentication
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated || !authResult.accountId) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Get password from request body for verification
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: 'Password is required to close account'
        },
        { status: 400 }
      );
    }

    // Get the account with password for verification
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      select: { 
        id: true, 
        email: true, 
        password: true,
        firstName: true,
        familyId: true,
        caretaker: { select: { id: true } }
      }
    });

    if (!account) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: 'Account not found'
        },
        { status: 404 }
      );
    }

    // Verify the password
    const isPasswordValid = await verifyPassword(password, account.password);
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: 'Password is incorrect'
        },
        { status: 400 }
      );
    }

    // Close the account by setting it as inactive and clearing sensitive data
    // We don't actually delete the record to maintain data integrity
    await prisma.account.update({
      where: { id: account.id },
      data: {
        // Mark as closed/inactive using existing fields
        verified: false,
        // Clear sensitive tokens
        verificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        // We could add a note in firstName or lastName to indicate closure
        // but for now we'll just use verified: false
      }
    });

    // If the account has a linked family, mark it as inactive
    if (account.familyId) {
      await prisma.family.update({
        where: { id: account.familyId },
        data: {
          isActive: false,
        }
      });
    }

    // If the account has a linked caretaker, we could also deactivate that
    if (account.caretaker) {
      await prisma.caretaker.update({
        where: { id: account.caretaker.id },
        data: {
          deletedAt: new Date(),
        }
      });
    }

    // Send account closure email
    try {
      await sendAccountClosureEmail(account.email, account.firstName || 'User');
      console.log(`Account closure email sent to: ${account.email}`);
    } catch (emailError) {
      console.error('Failed to send account closure email:', emailError);
      // Continue with success response - account is still closed even if email fails
    }

    console.log(`Account closed for email: ${account.email}`);

    return NextResponse.json<ApiResponse<CloseAccountResponse>>({
      success: true,
      data: {
        success: true,
        message: 'Account has been closed successfully. A confirmation email has been sent.'
      }
    });

  } catch (error) {
    console.error('Close account error:', error);
    return NextResponse.json<ApiResponse<CloseAccountResponse>>(
      {
        success: false,
        error: 'Failed to close account. Please try again later.'
      },
      { status: 500 }
    );
  }
}
