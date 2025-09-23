import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { Settings } from '@prisma/client';
import { withAuthContext, AuthResult } from '../utils/auth';

// Resolve a provided family identifier (id or slug) into a valid family ID
async function resolveFamilyId(familyIdentifier: string | null): Promise<string | null> {
  if (!familyIdentifier) return null;

  // Try direct ID lookup first
  const byId = await prisma.family.findUnique({ where: { id: familyIdentifier } });
  if (byId) return byId.id;

  // Fallback: treat identifier as slug
  const bySlug = await prisma.family.findUnique({ where: { slug: familyIdentifier } });
  return bySlug ? bySlug.id : null;
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId, isSetupAuth, isSysAdmin, isAccountAuth } = authContext;
    
    // Determine target family ID - prefer auth context, but allow query parameter for setup auth, account auth, and sysadmin
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && (isSetupAuth || isSysAdmin || isAccountAuth)) {
      const { searchParams } = new URL(req.url);
      const queryFamilyId = searchParams.get('familyId');
      if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      }
    }
    
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    // Normalize/validate family ID
    const normalizedFamilyId = await resolveFamilyId(targetFamilyId);
    if (!normalizedFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Family not found.' }, { status: 404 });
    }

    let settings = await prisma.settings.findFirst({
      where: { familyId: normalizedFamilyId },
    });
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          familyName: 'My Family', // Default family name
          defaultBottleUnit: 'OZ',
          defaultSolidsUnit: 'TBSP',
          defaultHeightUnit: 'IN',
          defaultWeightUnit: 'LB',
          defaultTempUnit: 'F',
          familyId: normalizedFamilyId,
        },
      });
    }

    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json<ApiResponse<Settings>>(
      {
        success: false,
        error: 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId, isSetupAuth, isSysAdmin, isAccountAuth } = authContext;
    
    // Determine target family ID - prefer auth context, but allow query parameter for setup auth, account auth, and sysadmin
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && (isSetupAuth || isSysAdmin || isAccountAuth)) {
      const { searchParams } = new URL(req.url);
      const queryFamilyId = searchParams.get('familyId');
      if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      }
    }
    
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const body = await req.json();
    console.log('Settings PUT request body:', body);
    
    // Normalize/validate family ID
    const normalizedFamilyId = await resolveFamilyId(targetFamilyId);
    if (!normalizedFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Family not found.' }, { status: 404 });
    }

    let existingSettings = await prisma.settings.findFirst({
      where: { familyId: normalizedFamilyId },
    });
    
    // Create default settings if missing so updates like setting a PIN work immediately after family creation
    if (!existingSettings) {
      existingSettings = await prisma.settings.create({
        data: {
          familyId: normalizedFamilyId,
          familyName: 'My Family',
          defaultBottleUnit: 'OZ',
          defaultSolidsUnit: 'TBSP',
          defaultHeightUnit: 'IN',
          defaultWeightUnit: 'LB',
          defaultTempUnit: 'F',
        },
      });
    }

    const data: Partial<Settings> = {};
    const allowedFields: (keyof Settings | 'notificationFeedAdvanceMinutes' | 'notificationDiaperAdvanceMinutes')[] = [
      'familyName', 'securityPin', 'defaultBottleUnit', 'defaultSolidsUnit', 
      'defaultHeightUnit', 'defaultWeightUnit', 'defaultTempUnit', 
      'enableDebugTimer', 'enableDebugTimezone', 'enableSwipeDateChange',
      // Notification fields
      'notificationEnabled', 'notificationProvider', 'hermesApiKey',
      'notificationTitle', 'notificationFeedSubtitle', 'notificationFeedBody',
      'notificationDiaperSubtitle', 'notificationDiaperBody',
      'notificationFeedAdvanceMinutes', 'notificationDiaperAdvanceMinutes'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (data as any)[field] = body[field];
      }
    }
    
    console.log('Settings data to update:', data);
    
    const settings = await prisma.settings.update({
      where: { id: existingSettings.id },
      data,
    });
    
    console.log('Settings updated successfully:', settings);

    // If securityPin was updated, also update system caretaker's pin
    if (body.securityPin !== undefined) {
      try {
        const systemCaretaker = await prisma.caretaker.findFirst({
          where: { 
            loginId: '00',
            familyId: normalizedFamilyId 
          }
        });

        if (systemCaretaker) {
          await prisma.caretaker.update({
            where: { id: systemCaretaker.id },
            data: { securityPin: body.securityPin }
          });
          console.log('Updated system caretaker security pin to match settings.');
        } else {
          console.log('System caretaker not found, skipping pin sync.');
        }
      } catch (error) {
        console.error('Error updating system caretaker pin (non-fatal):', error);
        // Don't fail the entire request if system caretaker update fails
      }
    }

    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json<ApiResponse<Settings>>(
      {
        success: false,
        error: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet);
export const PUT = withAuthContext(handlePut);
