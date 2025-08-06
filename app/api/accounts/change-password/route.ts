import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { hashPassword, verifyPassword } from '../../utils/password-utils';
import { getAuthenticatedUser } from '../../utils/auth';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
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

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ChangePasswordResponse>>> {
  try {
    // Verify authentication
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated || !authResult.accountId) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const body: ChangePasswordRequest = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: 'Current password and new password are required'
        },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (!isValidPassword(newPassword)) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: 'New password must be at least 8 characters and include lowercase & uppercase letters, numbers, and special characters (!@#$%^&*()_+-=[]{}|;:,.<>?)'
        },
        { status: 400 }
      );
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: 'New password must be different from current password'
        },
        { status: 400 }
      );
    }

    // Get the account
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      select: { id: true, email: true, password: true }
    });

    if (!account) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: 'Account not found'
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, account.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: 'Current password is incorrect'
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update the account with the new password
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedNewPassword,
      }
    });

    console.log(`Password changed successfully for account: ${account.email}`);

    return NextResponse.json<ApiResponse<ChangePasswordResponse>>({
      success: true,
      data: {
        success: true,
        message: 'Password changed successfully'
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
      {
        success: false,
        error: 'Failed to change password. Please try again later.'
      },
      { status: 500 }
    );
  }
}
