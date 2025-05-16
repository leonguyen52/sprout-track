import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, BabyCreate, BabyUpdate, BabyResponse } from '../types';
import { Gender } from '@prisma/client';
import { toUTC, formatForResponse } from '../utils/timezone';
import { withAuth, withAuthContext, AuthResult } from '../utils/auth';
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest) {
  try {
    const body: BabyCreate = await req.json();
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);

    const baby = await prisma.baby.create({
      data: {
        ...body,
        birthDate: toUTC(body.birthDate),
        ...(familyId && { familyId }), // Include family ID if available
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

async function handlePut(req: NextRequest) {
  try {
    const body: BabyUpdate = await req.json();
    const { id, ...updateData } = body;

    const existingBaby = await prisma.baby.findUnique({
      where: { id },
    });

    if (!existingBaby) {
      return NextResponse.json<ApiResponse<BabyResponse>>(
        {
          success: false,
          error: 'Baby not found',
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

async function handleDelete(req: NextRequest) {
  try {
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

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);

    if (id) {
      const baby = await prisma.baby.findUnique({
        where: { 
          id,
          deletedAt: null,
          ...(familyId && { familyId }), // Filter by family ID if available
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
        ...(familyId && { familyId }), // Filter by family ID if available
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
export const GET = withAuth(handleGet as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
export const POST = withAuth(handlePost as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
export const PUT = withAuth(handlePut as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
export const DELETE = withAuth(handleDelete as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
