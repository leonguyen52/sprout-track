import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, DiaperLogCreate, DiaperLogResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: DiaperLogCreate = await req.json();
    
    // Convert time to UTC for storage
    const timeUTC = toUTC(body.time);
    
    // Get family ID from request headers (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || (body as any).familyId;
    
    const diaperLog = await prisma.diaperLog.create({
      data: {
        ...body,
        time: timeUTC,
        caretakerId: authContext.caretakerId,
        familyId: familyId || null, // Include family ID if available
      },
    });

    // Format dates as ISO strings for response
    const response: DiaperLogResponse = {
      ...diaperLog,
      time: formatForResponse(diaperLog.time) || '',
      createdAt: formatForResponse(diaperLog.createdAt) || '',
      updatedAt: formatForResponse(diaperLog.updatedAt) || '',
      deletedAt: formatForResponse(diaperLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<DiaperLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating diaper log:', error);
    return NextResponse.json<ApiResponse<DiaperLogResponse>>(
      {
        success: false,
        error: 'Failed to create diaper log',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body: Partial<DiaperLogCreate> = await req.json();

    if (!id) {
      return NextResponse.json<ApiResponse<DiaperLogResponse>>(
        {
          success: false,
          error: 'Diaper log ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request headers (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || (body as any).familyId;

    // Check if diaper log exists and belongs to the family
    const existingDiaperLog = await prisma.diaperLog.findUnique({
      where: { id },
    });

    if (!existingDiaperLog) {
      return NextResponse.json<ApiResponse<DiaperLogResponse>>(
        {
          success: false,
          error: 'Diaper log not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingDiaperLog.familyId !== familyId) {
      return NextResponse.json<ApiResponse<DiaperLogResponse>>(
        {
          success: false,
          error: 'Diaper log not found',
        },
        { status: 404 }
      );
    }

    // Convert time to UTC if provided
    const data = body.time
      ? { ...body, time: toUTC(body.time) }
      : body;

    const diaperLog = await prisma.diaperLog.update({
      where: { id },
      data: {
        ...data,
        // Preserve existing familyId if not provided in update
        familyId: (data as any).familyId || existingDiaperLog.familyId,
      },
    });

    // Format dates as ISO strings for response
    const response: DiaperLogResponse = {
      ...diaperLog,
      time: formatForResponse(diaperLog.time) || '',
      createdAt: formatForResponse(diaperLog.createdAt) || '',
      updatedAt: formatForResponse(diaperLog.updatedAt) || '',
      deletedAt: formatForResponse(diaperLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<DiaperLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating diaper log:', error);
    return NextResponse.json<ApiResponse<DiaperLogResponse>>(
      {
        success: false,
        error: 'Failed to update diaper log',
      },
      { status: 500 }
    );
  }
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const babyId = searchParams.get('babyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Get family ID from request headers or query params
    const familyId = await getFamilyIdFromRequest(req) || searchParams.get('familyId');

    const queryParams = {
      ...(babyId && { babyId }),
      ...(startDate && endDate && {
        time: {
          gte: toUTC(startDate),
          lte: toUTC(endDate),
        },
      }),
      ...(familyId && { familyId }), // Filter by family ID if available
    };

    if (id) {
      const diaperLog = await prisma.diaperLog.findFirst({
        where: { 
          id,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (!diaperLog) {
        return NextResponse.json<ApiResponse<DiaperLogResponse>>(
          {
            success: false,
            error: 'Diaper log not found',
          },
          { status: 404 }
        );
      }

      // Format dates as ISO strings for response
      const response: DiaperLogResponse = {
        ...diaperLog,
        time: formatForResponse(diaperLog.time) || '',
        createdAt: formatForResponse(diaperLog.createdAt) || '',
        updatedAt: formatForResponse(diaperLog.updatedAt) || '',
        deletedAt: formatForResponse(diaperLog.deletedAt),
      };

      return NextResponse.json<ApiResponse<DiaperLogResponse>>({
        success: true,
        data: response,
      });
    }

    const diaperLogs = await prisma.diaperLog.findMany({
      where: queryParams,
      orderBy: {
        time: 'desc',
      },
    });

    // Format dates as ISO strings for response
    const response: DiaperLogResponse[] = diaperLogs.map(diaperLog => ({
      ...diaperLog,
      time: formatForResponse(diaperLog.time) || '',
      createdAt: formatForResponse(diaperLog.createdAt) || '',
      updatedAt: formatForResponse(diaperLog.updatedAt) || '',
      deletedAt: formatForResponse(diaperLog.deletedAt),
    }));

    return NextResponse.json<ApiResponse<DiaperLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching diaper logs:', error);
    return NextResponse.json<ApiResponse<DiaperLogResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch diaper logs',
      },
      { status: 500 }
    );
  }
}

async function handleDelete(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Diaper log ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request headers
    const familyId = await getFamilyIdFromRequest(req);

    // Check if diaper log exists and belongs to the family
    const existingDiaperLog = await prisma.diaperLog.findUnique({
      where: { id },
    });

    if (!existingDiaperLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Diaper log not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingDiaperLog.familyId !== familyId) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Diaper log not found',
        },
        { status: 404 }
      );
    }

    await prisma.diaperLog.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting diaper log:', error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: 'Failed to delete diaper log',
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
