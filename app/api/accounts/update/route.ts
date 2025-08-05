import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withAuthContext, AuthResult } from '../../utils/auth';

interface AccountUpdateRequest {
  firstName: string;
  lastName?: string;
  email: string;
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { accountId, isAccountAuth } = authContext;
    
    if (!isAccountAuth || !accountId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Account authentication required' },
        { status: 403 }
      );
    }

    const body: AccountUpdateRequest = await req.json();

    // Validate required fields
    if (!body.firstName || !body.email) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'First name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another account
    if (body.email) {
      const existingAccount = await prisma.account.findFirst({
        where: {
          email: body.email,
          id: { not: accountId }
        }
      });

      if (existingAccount) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Email address is already in use' },
          { status: 400 }
        );
      }
    }

    // Update the account
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName || null,
        email: body.email,
      },
    });

    // Return updated account data (excluding sensitive fields)
    const response = {
      accountId: updatedAccount.id,
      email: updatedAccount.email,
      firstName: updatedAccount.firstName,
      lastName: updatedAccount.lastName,
      verified: updatedAccount.verified,
      betaparticipant: updatedAccount.betaparticipant,
    };

    return NextResponse.json<ApiResponse<typeof response>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export const PUT = withAuthContext(handlePut as any);
