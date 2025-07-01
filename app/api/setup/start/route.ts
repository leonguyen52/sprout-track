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
      // Invitation Mode - validate the token
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
      // No token provided - check if this is a valid scenario
      const families = await prisma.family.findMany();
      
      if (families.length === 0) {
        // Fresh install - no families exist, allow creation
      } else if (families.length === 1 && families[0].slug === 'my-family') {
        // Initial setup scenario - only default family exists, allow system admin to create actual family
        // This replaces the default "My Family" created by the seed script
      } else {
        // Multiple families exist or non-default family exists
        // Require invitation token for additional families
        return NextResponse.json({ success: false, error: 'Cannot create family without invitation token' }, { status: 403 });
      }
    }

    // Check if slug is unique
    const existingFamily = await prisma.family.findUnique({ where: { slug } });
    if (existingFamily) {
      return NextResponse.json({ success: false, error: 'That URL is already taken' }, { status: 409 });
    }

    const newFamily = await prisma.$transaction(async (tx) => {
      // If this is initial setup (no token and only default family exists), 
      // deactivate the default family first
      if (!token) {
        const families = await tx.family.findMany();
        if (families.length === 1 && families[0].slug === 'my-family') {
          await tx.family.update({
            where: { id: families[0].id },
            data: { isActive: false },
          });
        }
      }

      const family = await tx.family.create({
        data: {
          name,
          slug,
          isActive: true,
        },
      });

      // Create family settings
      await tx.settings.create({
        data: {
          familyId: family.id,
          familyName: name,
        },
      });

      if (token) {
        // Mark the invitation token as used
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