import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withSysAdminAuth } from '../../utils/auth';

interface AccountManageResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  verified: boolean;
  betaparticipant: boolean;
  closed: boolean;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  familyId: string | null;
  family: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// GET - Get all accounts for management
async function getHandler(req: NextRequest): Promise<NextResponse<ApiResponse<AccountManageResponse[]>>> {
  try {
    // Fetch all accounts with family information
    const accounts = await prisma.account.findMany({
      include: {
        family: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const accountsData: AccountManageResponse[] = accounts.map(account => ({
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      verified: account.verified,
      betaparticipant: account.betaparticipant,
      closed: account.closed,
      closedAt: account.closedAt?.toISOString() || null,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      familyId: account.familyId,
      family: account.family
    }));

    return NextResponse.json<ApiResponse<AccountManageResponse[]>>({
      success: true,
      data: accountsData
    });

  } catch (error) {
    console.error('Account management fetch error:', error);
    return NextResponse.json<ApiResponse<AccountManageResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch accounts'
      },
      { status: 500 }
    );
  }
}

// PUT - Update account status (close/reinstate)
async function putHandler(req: NextRequest): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await req.json();
    const { id, closed } = body;

    if (!id || typeof closed !== 'boolean') {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        {
          success: false,
          error: 'Account ID and closed status are required'
        },
        { status: 400 }
      );
    }

    // Find the account
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        family: true,
        caretaker: true
      }
    });

    if (!account) {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        {
          success: false,
          error: 'Account not found'
        },
        { status: 404 }
      );
    }

    // Update account status
    const updateData: any = {
      closed,
      closedAt: closed ? new Date() : null
    };

    await prisma.account.update({
      where: { id },
      data: updateData
    });

    // If closing the account, also deactivate the family and caretaker
    if (closed) {
      if (account.familyId) {
        await prisma.family.update({
          where: { id: account.familyId },
          data: { isActive: false }
        });
      }
      
      if (account.caretaker) {
        await prisma.caretaker.update({
          where: { id: account.caretaker.id },
          data: { deletedAt: new Date() }
        });
      }
    } else {
      // If reinstating the account, reactivate the family and caretaker
      if (account.familyId) {
        await prisma.family.update({
          where: { id: account.familyId },
          data: { isActive: true }
        });
      }
      
      if (account.caretaker) {
        await prisma.caretaker.update({
          where: { id: account.caretaker.id },
          data: { deletedAt: null }
        });
      }
    }

    const action = closed ? 'closed' : 'reinstated';
    console.log(`Account ${action} for email: ${account.email}`);

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: {
        message: `Account has been ${action} successfully`
      }
    });

  } catch (error) {
    console.error('Account management update error:', error);
    return NextResponse.json<ApiResponse<{ message: string }>>(
      {
        success: false,
        error: 'Failed to update account status'
      },
      { status: 500 }
    );
  }
}

// Export handlers with sysadmin authentication
export const GET = withSysAdminAuth(getHandler);
export const PUT = withSysAdminAuth(putHandler);
