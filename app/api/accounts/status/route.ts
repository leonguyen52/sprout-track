import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, ApiResponse } from '../../utils/auth';
import prisma from '../../db';

interface AccountStatusResponse {
  accountId: string;
  email: string;
  firstName: string;
  lastName?: string;
  verified: boolean;
  hasFamily: boolean;
  familySlug?: string;
  familyName?: string;
}

async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<AccountStatusResponse>>> {
  try {
    // Use the standard auth method
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<AccountStatusResponse>>(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Only allow account authentication for this endpoint
    if (!authResult.isAccountAuth || !authResult.accountId) {
      return NextResponse.json<ApiResponse<AccountStatusResponse>>(
        {
          success: false,
          error: 'Account authentication required'
        },
        { status: 403 }
      );
    }

    // Fetch account with family information
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      include: {
        family: {
          select: {
            slug: true,
            name: true
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json<ApiResponse<AccountStatusResponse>>(
        {
          success: false,
          error: 'Account not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<AccountStatusResponse>>({
      success: true,
      data: {
        accountId: account.id,
        email: account.email,
        firstName: account.firstName || '',
        lastName: account.lastName || undefined,
        verified: account.verified,
        hasFamily: !!account.family,
        familySlug: account.family?.slug,
        familyName: account.family?.name
      }
    });

  } catch (error) {
    console.error('Account status error:', error);
    return NextResponse.json<ApiResponse<AccountStatusResponse>>(
      {
        success: false,
        error: 'Failed to fetch account status'
      },
      { status: 500 }
    );
  }
}

export const GET = handler;