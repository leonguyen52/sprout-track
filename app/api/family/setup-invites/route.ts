import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withSysAdminAuth } from '../../utils/auth';

interface FamilySetupInvite {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  isUsed: boolean;
  familyId: string | null;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    loginId: string;
  } | null;
  family: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// GET - Get all active family setup invites for management
async function getHandler(req: NextRequest): Promise<NextResponse<ApiResponse<FamilySetupInvite[]>>> {
  try {
    const setupInvites = await prisma.familySetup.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            loginId: true,
          }
        },
        family: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    // Convert to response format with additional computed fields
    const inviteResponses: FamilySetupInvite[] = setupInvites.map((invite) => {
      const now = new Date();
      const isExpired = invite.expiresAt < now;
      const isUsed = invite.familyId !== null;

      return {
        id: invite.id,
        token: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
        createdAt: invite.createdAt.toISOString(),
        updatedAt: invite.updatedAt.toISOString(),
        isExpired,
        isUsed,
        familyId: invite.familyId,
        createdBy: invite.createdBy,
        creator: invite.creator,
        family: invite.family,
      };
    });

    return NextResponse.json({
      success: true,
      data: inviteResponses,
    });
  } catch (error) {
    console.error('Error fetching family setup invites:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch family setup invites',
    }, { status: 500 });
  }
}

// DELETE - Delete/revoke a family setup invite
async function deleteHandler(req: NextRequest): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json({
        success: false,
        error: 'Invite ID is required',
      }, { status: 400 });
    }

    // Check if invite exists
    const existingInvite = await prisma.familySetup.findUnique({
      where: { id: inviteId }
    });

    if (!existingInvite) {
      return NextResponse.json({
        success: false,
        error: 'Invite not found',
      }, { status: 404 });
    }

    // Delete the invite
    await prisma.familySetup.delete({
      where: { id: inviteId }
    });

    return NextResponse.json({
      success: true,
      data: { id: inviteId },
    });
  } catch (error) {
    console.error('Error deleting family setup invite:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete family setup invite',
    }, { status: 500 });
  }
}

// Export handlers with sysadmin authentication
export const GET = withSysAdminAuth(getHandler);
export const DELETE = withSysAdminAuth(deleteHandler); 