import { NextRequest, NextResponse } from 'next/server';
import { withAuthContext, ApiResponse, AuthResult } from '@/app/api/utils/auth';
import prisma from '@/prisma/db';
import crypto from 'crypto';

interface SetupLinkResponse {
  setupUrl: string;
}

async function handler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<SetupLinkResponse>>> {
  const { caretakerId } = authContext;

  if (!caretakerId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await prisma.familySetup.create({
      data: {
        token,
        expiresAt,
        createdBy: caretakerId,
      },
    });

    const setupUrl = `/setup/${token}`;

    return NextResponse.json({ success: true, data: { setupUrl } });
  } catch (error) {
    console.error('Error creating setup link:', error);
    return NextResponse.json({ success: false, error: 'Error creating setup link' }, { status: 500 });
  }
}

export const POST = withAuthContext(handler); 