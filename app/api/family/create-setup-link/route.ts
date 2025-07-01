import { NextRequest, NextResponse } from 'next/server';
import { withAuthContext, ApiResponse, AuthResult } from '@/app/api/utils/auth';
import prisma from '@/prisma/db';
import crypto from 'crypto';

interface SetupLinkResponse {
  setupUrl: string;
  token: string;
}

async function handler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<SetupLinkResponse>>> {
  const { caretakerId, isSysAdmin } = authContext;

  // Check if user is a system administrator first
  if (!isSysAdmin) {
    return NextResponse.json({ success: false, error: 'Only system administrators can create setup links' }, { status: 403 });
  }

  try {
    // For system administrators, we need to find the actual system caretaker ID
    // since the auth middleware sets caretakerId to null for system caretakers
    let actualCaretakerId = caretakerId;
    
    if (!actualCaretakerId) {
      // Find the system caretaker (loginId '00') to use as createdBy
      const systemCaretaker = await prisma.caretaker.findFirst({
        where: {
          loginId: '00',
          deletedAt: null,
        },
      });
      
      if (!systemCaretaker) {
        return NextResponse.json({ success: false, error: 'System caretaker not found' }, { status: 500 });
      }
      
      actualCaretakerId = systemCaretaker.id;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await prisma.familySetup.create({
      data: {
        token,
        expiresAt,
        createdBy: actualCaretakerId,
      },
    });

    const setupUrl = `/setup/${token}`;

    return NextResponse.json({ success: true, data: { setupUrl, token } });
  } catch (error) {
    console.error('Error creating setup link:', error);
    return NextResponse.json({ success: false, error: 'Error creating setup link' }, { status: 500 });
  }
}

export const POST = withAuthContext(handler); 