import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, BabyCreate, BabyUpdate, BabyResponse } from '../types';
import { Gender } from '@prisma/client';
import { toUTC, formatForResponse } from '../utils/timezone';
import { withAuthContext, AuthResult } from '../utils/auth';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId, isSetupAuth } = authContext;
    
    const requestBody = await req.json();
    const { familyId: bodyFamilyId, ...babyData } = requestBody;
    const body: BabyCreate = babyData;
    
    // Determine target family ID - prefer auth context, but allow body override for setup auth
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && isSetupAuth && bodyFamilyId) {
      targetFamilyId = bodyFamilyId;
    }
    
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const baby = await prisma.baby.create({
      data: {
        ...body,
        birthDate: toUTC(body.birthDate),
        familyId: targetFamilyId, // Set family ID from trusted context or setup auth
      },
    });

    // Format response with ISO strings
    const response: BabyResponse = {
      ...baby,
      birthDate: formatForResponse(baby.birthDate) || '',
      createdAt: formatForResponse(baby.createdAt) || '',
      updatedAt: formatForResponse(baby.updatedAt) || '',
      deletedAt: formatForResponse(baby.deletedAt),
    };

    return NextResponse.json<ApiResponse<BabyResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating baby:', error);
    return NextResponse.json<ApiResponse<BabyResponse>>(
      {
        success: false,
        error: 'Failed to create baby',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const body: BabyUpdate = await req.json();
    const { id, ...updateData } = body;

    const existingBaby = await prisma.baby.findFirst({
      where: { id, familyId: userFamilyId },
    });

    if (!existingBaby) {
      return NextResponse.json<ApiResponse<BabyResponse>>(
        {
          success: false,
          error: 'Baby not found or access denied',
        },
        { status: 404 }
      );
    }

    const baby = await prisma.baby.update({
      where: { id },
      data: {
        ...updateData,
        birthDate: updateData.birthDate ? toUTC(updateData.birthDate) : existingBaby.birthDate,
      },
    });

    // Format response with ISO strings
    const response: BabyResponse = {
      ...baby,
      birthDate: formatForResponse(baby.birthDate) || '',
      createdAt: formatForResponse(baby.createdAt) || '',
      updatedAt: formatForResponse(baby.updatedAt) || '',
      deletedAt: formatForResponse(baby.deletedAt),
    };

    return NextResponse.json<ApiResponse<BabyResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating baby:', error);
    return NextResponse.json<ApiResponse<BabyResponse>>(
      {
        success: false,
        error: 'Failed to update baby',
      },
      { status: 500 }
    );
  }
}

async function handleDelete(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Baby ID is required',
        },
        { status: 400 }
      );
    }

    // Verify baby belongs to user's family before deleting
    const existingBaby = await prisma.baby.findFirst({
      where: { id, familyId: userFamilyId },
    });

    if (!existingBaby) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Baby not found or access denied',
        },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt
    await prisma.baby.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting baby:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete baby',
      },
      { status: 500 }
    );
  }
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (id) {
      const baby = await prisma.baby.findFirst({
        where: { 
          id,
          deletedAt: null,
          familyId: userFamilyId, // Filter by family ID from context
        },
      });

      if (!baby) {
        return NextResponse.json<ApiResponse<BabyResponse>>(
          {
            success: false,
            error: 'Baby not found',
          },
          { status: 404 }
        );
      }

      // Format response with ISO strings
      const response: BabyResponse = {
        ...baby,
        birthDate: formatForResponse(baby.birthDate) || '',
        createdAt: formatForResponse(baby.createdAt) || '',
        updatedAt: formatForResponse(baby.updatedAt) || '',
        deletedAt: formatForResponse(baby.deletedAt),
      };

      return NextResponse.json<ApiResponse<BabyResponse>>({
        success: true,
        data: response,
      });
    }

    const babies = await prisma.baby.findMany({
      where: {
        deletedAt: null,
        familyId: userFamilyId, // Filter by family ID from context
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response with ISO strings
    const response: BabyResponse[] = babies.map(baby => ({
      ...baby,
      birthDate: formatForResponse(baby.birthDate) || '',
      createdAt: formatForResponse(baby.createdAt) || '',
      updatedAt: formatForResponse(baby.updatedAt) || '',
      deletedAt: formatForResponse(baby.deletedAt),
    }));

    return NextResponse.json<ApiResponse<BabyResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching babies:', error);
    return NextResponse.json<ApiResponse<BabyResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch babies',
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware to all handlers
// Use type assertions to handle the multiple return types
export const GET = withAuthContext(handleGet as (req: NextRequest, authContext: AuthResult) => Promise<NextResponse<ApiResponse<any>>>);
export const POST = withAuthContext(handlePost as (req: NextRequest, authContext: AuthResult) => Promise<NextResponse<ApiResponse<any>>>);
export const PUT = withAuthContext(handlePut as (req: NextRequest, authContext: AuthResult) => Promise<NextResponse<ApiResponse<any>>>);
export const DELETE = withAuthContext(handleDelete as (req: NextRequest, authContext: AuthResult) => Promise<NextResponse<ApiResponse<any>>>);
