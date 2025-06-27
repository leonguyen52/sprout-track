import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { ApiResponse } from '@/app/api/utils/auth';
import { Family } from '@prisma/client';

interface SetupStartRequest {
  name: string;
  slug: string;
  token?: string;
}

async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<Family>>> {
  const { name, slug, token } = (await req.json()) as SetupStartRequest;

  if (!name || !slug) {
    return NextResponse.json({ success: false, error: 'Family name and slug are required' }, { status: 400 });
  }

  try {
    if (token) {
      // Invitation Mode
      const setupToken = await prisma.familySetup.findUnique({
        where: { token },
      });

      if (!setupToken || setupToken.expiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 404 });
      }

      if (setupToken.familyId) {
        return NextResponse.json({ success: false, error: 'Token has already been used' }, { status: 409 });
      }
    } else {
      // Fresh Install Mode
      const familyCount = await prisma.family.count();
      if (familyCount > 0) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    // Check if slug is unique
    const existingFamily = await prisma.family.findUnique({ where: { slug } });
    if (existingFamily) {
      return NextResponse.json({ success: false, error: 'That URL is already taken' }, { status: 409 });
    }

    const newFamily = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          name,
          slug,
        },
      });

      await tx.settings.create({
        data: {
          familyId: family.id,
          familyName: name,
        },
      });

      if (token) {
        await tx.familySetup.update({
          where: { token },
          data: { familyId: family.id },
        });
      }

      return family;
    });

    return NextResponse.json({ success: true, data: newFamily });
  } catch (error) {
    console.error('Error starting setup:', error);
    return NextResponse.json({ success: false, error: 'Error starting setup' }, { status: 500 });
  }
}

export const POST = handler; 