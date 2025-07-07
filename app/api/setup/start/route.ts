import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { ApiResponse, withAdminAuth, getAuthenticatedUser } from '@/app/api/utils/auth';
import { Family } from '@prisma/client';

interface SetupStartRequest {
  name: string;
  slug: string;
  token?: string;
  isNewFamily?: boolean; // Flag to indicate this is a new family creation vs initial setup
}

async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<Family>>> {
  const { name, slug, token, isNewFamily = false } = (await req.json()) as SetupStartRequest;

  if (!name || !slug) {
    return NextResponse.json({ success: false, error: 'Family name and slug are required' }, { status: 400 });
  }

  // Get authentication context
  const authResult = await getAuthenticatedUser(req);
  
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  // Check for setup token authentication
  let setupTokenData = null;
  if (token) {
    // For setup token auth, verify the token matches the one in the JWT
    if (authResult.isSetupAuth && authResult.setupToken === token) {
      // Valid setup token authentication
      setupTokenData = await prisma.familySetup.findUnique({
        where: { token },
      });
      
      if (!setupTokenData || setupTokenData.expiresAt < new Date() || setupTokenData.familyId) {
        return NextResponse.json({ success: false, error: 'Invalid or expired setup token' }, { status: 403 });
      }
    } else if (!authResult.isSysAdmin && authResult.caretakerRole !== 'ADMIN') {
      // Token provided but user doesn't have permission or wrong token in auth
      return NextResponse.json({ success: false, error: 'Invalid setup token authentication' }, { status: 403 });
    } else {
      // Admin/sysadmin using token for some reason - validate it exists
      setupTokenData = await prisma.familySetup.findUnique({
        where: { token },
      });
      
      if (!setupTokenData || setupTokenData.expiresAt < new Date() || setupTokenData.familyId) {
        return NextResponse.json({ success: false, error: 'Invalid or expired setup token' }, { status: 403 });
      }
    }
  }

  try {
    if (token && setupTokenData) {
      // SCENARIO 3: Token-based setup - create new family and mark token as used
      
      // Check if slug is unique
      const existingFamily = await prisma.family.findUnique({ where: { slug } });
      if (existingFamily) {
        return NextResponse.json({ success: false, error: 'That URL is already taken' }, { status: 409 });
      }

      const updatedFamily = await prisma.$transaction(async (tx) => {
        // Create new family
        const family = await tx.family.create({
          data: {
            name,
            slug,
            isActive: true,
          },
        });

        // Create settings for the family
        await tx.settings.create({
          data: {
            familyId: family.id,
            familyName: name,
          },
        });

        // Create system caretaker for the family
        await tx.caretaker.create({
          data: {
            loginId: '00',
            name: 'system',
            type: 'System Administrator',
            role: 'ADMIN',
            securityPin: '111222', // Default PIN
            familyId: family.id,
            inactive: false,
          },
        });

        // Mark the invitation token as used
        await tx.familySetup.update({
          where: { token },
          data: { familyId: family.id },
        });

        return family;
      });

      return NextResponse.json({ success: true, data: updatedFamily });
    } else if (authResult.isSysAdmin || authResult.caretakerRole === 'ADMIN') {
      // System admin or admin caretaker scenarios (requires appropriate authentication)
      
      // Check if slug is unique
      const existingFamily = await prisma.family.findUnique({ where: { slug } });
      if (existingFamily) {
        return NextResponse.json({ success: false, error: 'That URL is already taken' }, { status: 409 });
      }

      const updatedFamily = await prisma.$transaction(async (tx) => {
        let family;

        if (isNewFamily) {
          // SCENARIO 2: Sysadmin creating a new family (from FamilyForm)
          family = await tx.family.create({
            data: {
              name,
              slug,
              isActive: true,
            },
          });

          await tx.settings.create({
            data: {
              familyId: family.id,
              familyName: name,
            },
          });

          // Create system caretaker for the family
          await tx.caretaker.create({
            data: {
              loginId: '00',
              name: 'system',
              type: 'System Administrator',
              role: 'ADMIN',
              securityPin: '111222', // Default PIN
              familyId: family.id,
              inactive: false,
            },
          });
        } else {
          // SCENARIO 1: Brand new setup - update existing default family or create new one
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
                name,
                slug,
                isActive: true,
              },
            });

            await tx.settings.create({
              data: {
                familyId: family.id,
                familyName: name,
              },
            });

            // Create system caretaker for the family
            await tx.caretaker.create({
              data: {
                loginId: '00',
                name: 'system',
                type: 'System Administrator',
                role: 'ADMIN',
                securityPin: '111222', // Default PIN
                familyId: family.id,
                inactive: false,
              },
            });
          }
        }

        return family;
      });

      return NextResponse.json({ success: true, data: updatedFamily });
    }

    // This should not be reached due to authentication check above
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  } catch (error) {
    console.error('Error starting setup:', error);
    return NextResponse.json({ success: false, error: 'Error starting setup' }, { status: 500 });
  }
}

export const POST = withAdminAuth(handler); 