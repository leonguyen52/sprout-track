import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, CaretakerCreate, CaretakerUpdate, CaretakerResponse } from '../types';
import { withAdminAuth } from '../utils/auth';
import { formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function postHandler(req: NextRequest) {
  try {
    const body: CaretakerCreate = await req.json();
    
    // Get family ID from request headers (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || (body as any).familyId;

    // Check if loginId is already in use within the same family
    const existingCaretaker = await prisma.caretaker.findFirst({
      where: {
        loginId: body.loginId,
        deletedAt: null,
        ...(familyId && { familyId }), // Filter by family ID if available
      },
    });

    if (existingCaretaker) {
      return NextResponse.json<ApiResponse<CaretakerResponse>>(
        {
          success: false,
          error: 'Login ID is already in use. Please choose a different one.',
        },
        { status: 400 }
      );
    }

    const caretaker = await prisma.caretaker.create({
      data: {
        ...body,
        familyId: familyId || null, // Include family ID if available
      },
    });

    // Format response with ISO strings
    const response: CaretakerResponse = {
      ...caretaker,
      createdAt: formatForResponse(caretaker.createdAt) || '',
      updatedAt: formatForResponse(caretaker.updatedAt) || '',
      deletedAt: formatForResponse(caretaker.deletedAt),
    };

    return NextResponse.json<ApiResponse<CaretakerResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating caretaker:', error);
    return NextResponse.json<ApiResponse<CaretakerResponse>>(
      {
        success: false,
        error: 'Failed to create caretaker',
      },
      { status: 500 }
    );
  }
}

async function putHandler(req: NextRequest) {
  try {
    const body: CaretakerUpdate = await req.json();
    const { id, ...updateData } = body;

    // Get family ID from request headers (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || (body as any).familyId;

    // Check if caretaker exists and belongs to the family
    const existingCaretaker = await prisma.caretaker.findUnique({
      where: { id },
    });

    if (!existingCaretaker) {
      return NextResponse.json<ApiResponse<CaretakerResponse>>(
        {
          success: false,
          error: 'Caretaker not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingCaretaker.familyId !== familyId) {
      return NextResponse.json<ApiResponse<CaretakerResponse>>(
        {
          success: false,
          error: 'Caretaker not found',
        },
        { status: 404 }
      );
    }

    // If loginId is being updated, check if it's already in use by another caretaker in the same family
    if (updateData.loginId) {
      const duplicateLoginId = await prisma.caretaker.findFirst({
        where: {
          loginId: updateData.loginId,
          id: { not: id },
          deletedAt: null,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (duplicateLoginId) {
        return NextResponse.json<ApiResponse<CaretakerResponse>>(
          {
            success: false,
            error: 'Login ID is already in use. Please choose a different one.',
          },
          { status: 400 }
        );
      }
    }

    const caretaker = await prisma.caretaker.update({
      where: { id },
      data: {
        ...updateData,
        // Preserve existing familyId if not provided in update
        familyId: (updateData as any).familyId || existingCaretaker.familyId,
      },
    });

    // Format response with ISO strings
    const response: CaretakerResponse = {
      ...caretaker,
      createdAt: formatForResponse(caretaker.createdAt) || '',
      updatedAt: formatForResponse(caretaker.updatedAt) || '',
      deletedAt: formatForResponse(caretaker.deletedAt),
    };

    return NextResponse.json<ApiResponse<CaretakerResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating caretaker:', error);
    return NextResponse.json<ApiResponse<CaretakerResponse>>(
      {
        success: false,
        error: 'Failed to update caretaker',
      },
      { status: 500 }
    );
  }
}

async function deleteHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Caretaker ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request headers
    const familyId = await getFamilyIdFromRequest(req);

    // Check if caretaker exists and belongs to the family
    const existingCaretaker = await prisma.caretaker.findUnique({
      where: { id },
    });

    if (!existingCaretaker) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Caretaker not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingCaretaker.familyId !== familyId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Caretaker not found',
        },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt
    await prisma.caretaker.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting caretaker:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete caretaker',
      },
      { status: 500 }
    );
  }
}

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    // Get family ID from request headers or query params
    const familyId = await getFamilyIdFromRequest(req) || searchParams.get('familyId');

    if (id) {
      const caretaker = await prisma.caretaker.findFirst({
        where: { 
          id,
          deletedAt: null,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (!caretaker) {
        return NextResponse.json<ApiResponse<CaretakerResponse>>(
          {
            success: false,
            error: 'Caretaker not found',
          },
          { status: 404 }
        );
      }

      // Format response with ISO strings
      const response: CaretakerResponse = {
        ...caretaker,
        createdAt: formatForResponse(caretaker.createdAt) || '',
        updatedAt: formatForResponse(caretaker.updatedAt) || '',
        deletedAt: formatForResponse(caretaker.deletedAt),
      };

      return NextResponse.json<ApiResponse<CaretakerResponse>>({
        success: true,
        data: response,
      });
    }

    // Get query parameter for including inactive caretakers
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const caretakers = await prisma.caretaker.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { inactive: false }),
        ...(familyId && { familyId }), // Filter by family ID if available
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format response with ISO strings
    const response: CaretakerResponse[] = caretakers.map((caretaker) => ({
      ...caretaker,
      createdAt: formatForResponse(caretaker.createdAt) || '',
      updatedAt: formatForResponse(caretaker.updatedAt) || '',
      deletedAt: formatForResponse(caretaker.deletedAt),
    }));

    return NextResponse.json<ApiResponse<CaretakerResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching caretakers:', error);
    return NextResponse.json<ApiResponse<CaretakerResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch caretakers',
      },
      { status: 500 }
    );
  }
}

// Export the handlers with appropriate authentication
// Use type assertions to handle both single and array response types
// All caretaker operations now require admin authentication
export const GET = withAdminAuth(getHandler as any);
export const POST = withAdminAuth(postHandler as any);
export const PUT = withAdminAuth(putHandler as any);
export const DELETE = withAdminAuth(deleteHandler as any);
