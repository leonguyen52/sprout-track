import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { ApiResponse } from '@/app/api/utils/auth';

interface ValidateTokenRequest {
  token: string;
}

async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<{ valid: boolean }>>> {
  try {
    const { token } = (await req.json()) as ValidateTokenRequest;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    // Check if the token exists and is valid
    const setupToken = await prisma.familySetup.findUnique({
      where: { token },
    });

    if (!setupToken) {
      return NextResponse.json({ success: false, error: 'Invalid setup token' }, { status: 404 });
    }

    if (setupToken.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Setup token has expired' }, { status: 410 });
    }

    if (setupToken.familyId) {
      return NextResponse.json({ success: false, error: 'Setup token has already been used' }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: { valid: true } });
  } catch (error) {
    console.error('Error validating setup token:', error);
    return NextResponse.json({ success: false, error: 'Error validating setup token' }, { status: 500 });
  }
}

export const POST = handler; 