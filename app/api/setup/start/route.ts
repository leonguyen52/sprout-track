import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { ApiResponse } from '@/app/api/utils/auth';
import { Family } from '@prisma/client';
import { randomUUID } from 'crypto';

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

    const updatedFamily = await prisma.$transaction(async (tx) => {
      let family;

      if (!token) {
        // Initial setup - modify the existing default family instead of creating new one
        const families = await tx.family.findMany();
        if (families.length === 1 && families[0].slug === 'my-family') {
          // Update the existing default family
          family = await tx.family.update({
            where: { id: families[0].id },
            data: {
              name,
              slug,
              isActive: true,
            },
          });

          // Update the existing settings for this family
          await tx.settings.updateMany({
            where: { familyId: family.id },
            data: {
              familyName: name,
            },
          });
        } else {
          // Fallback: create new family if default doesn't exist
          family = await tx.family.create({
            data: {
              id: randomUUID(),
              name,
              slug,
              isActive: true,
            },
          });

          await tx.settings.create({
            data: {
              id: randomUUID(),
              familyId: family.id,
              familyName: name,
            },
          });
        }
      } else {
        // Token-based setup - create new family
        family = await tx.family.create({
          data: {
            id: randomUUID(),
            name,
            slug,
            isActive: true,
          },
        });

        await tx.settings.create({
          data: {
            id: randomUUID(),
            familyId: family.id,
            familyName: name,
          },
        });

        // Mark the invitation token as used
        await tx.familySetup.update({
          where: { token },
          data: { familyId: family.id },
        });
      }

      return family;
    });

    return NextResponse.json({ success: true, data: updatedFamily });
  } catch (error) {
    console.error('Error starting setup:', error);
    return NextResponse.json({ success: false, error: 'Error starting setup' }, { status: 500 });
  }
}

export const POST = handler; 