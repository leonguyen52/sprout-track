import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { Settings } from '@prisma/client';
import { withAuth } from '../utils/auth';
import { getFamilyIdFromRequest } from '../utils/family';

async function handleGet(req: NextRequest) {
  try {
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);
    
    // Get the settings record for the family or create default
    let settings;
    
    if (familyId) {
      settings = await prisma.settings.findFirst({
        where: { familyId } as any // Type cast to avoid TypeScript error
      });
    } else {
      settings = await prisma.settings.findFirst();
    }
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          familyName: 'My Family', // Default family name
          defaultBottleUnit: 'OZ',
          defaultSolidsUnit: 'TBSP',
          defaultHeightUnit: 'IN',
          defaultWeightUnit: 'LB',
          defaultTempUnit: 'F',
          ...(familyId && { familyId }), // Include family ID if available
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

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);
    
    // Cast to any to avoid TypeScript errors with the new fields
    const data: any = {
      familyName: body.familyName,
      securityPin: body.securityPin,
      defaultBottleUnit: body.defaultBottleUnit,
      defaultSolidsUnit: body.defaultSolidsUnit,
      defaultHeightUnit: body.defaultHeightUnit,
      defaultWeightUnit: body.defaultWeightUnit,
      defaultTempUnit: body.defaultTempUnit,
      enableDebugTimer: body.enableDebugTimer || false,
      enableDebugTimezone: body.enableDebugTimezone || false,
      ...(familyId && { familyId }), // Include family ID if available
    };
    
    const settings = await prisma.settings.create({
      data,
    });

    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error creating settings:', error);
    return NextResponse.json<ApiResponse<Settings>>(
      {
        success: false,
        error: 'Failed to create settings',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);
    
    // Get the settings record for the family
    let existingSettings;
    
    if (familyId) {
      existingSettings = await prisma.settings.findFirst({
        where: { familyId } as any // Type cast to avoid TypeScript error
      });
    } else {
      existingSettings = await prisma.settings.findFirst();
    }
    
    if (!existingSettings) {
      return NextResponse.json<ApiResponse<Settings>>(
        {
          success: false,
          error: 'Settings not found',
        },
        { status: 404 }
      );
    }

    // Cast to any to avoid TypeScript errors with the new fields
    const data: any = {
      familyName: body.familyName,
      securityPin: body.securityPin,
      defaultBottleUnit: body.defaultBottleUnit,
      defaultSolidsUnit: body.defaultSolidsUnit,
      defaultHeightUnit: body.defaultHeightUnit,
      defaultWeightUnit: body.defaultWeightUnit,
      defaultTempUnit: body.defaultTempUnit,
    };
    
    // Add debug settings if they exist in the body
    if (body.enableDebugTimer !== undefined) {
      data.enableDebugTimer = body.enableDebugTimer;
    } else if ((existingSettings as any).enableDebugTimer !== undefined) {
      data.enableDebugTimer = (existingSettings as any).enableDebugTimer;
    }
    
    if (body.enableDebugTimezone !== undefined) {
      data.enableDebugTimezone = body.enableDebugTimezone;
    } else if ((existingSettings as any).enableDebugTimezone !== undefined) {
      data.enableDebugTimezone = (existingSettings as any).enableDebugTimezone;
    }
    
    const settings = await prisma.settings.update({
      where: { id: existingSettings.id },
      data,
    });

    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json<ApiResponse<Settings>>(
      {
        success: false,
        error: 'Failed to update settings',
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware to all handlers
// Use type assertions to handle the multiple return types
export const GET = withAuth(handleGet as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
export const POST = withAuth(handlePost as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
export const PUT = withAuth(handlePut as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
