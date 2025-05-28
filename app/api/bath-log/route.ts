import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, BathLogCreate, BathLogResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: BathLogCreate = await req.json();
    
    // Convert time to UTC for storage
    const timeUTC = toUTC(body.time);
    
    // Get family ID from request (body, query params, or URL slug)
    const familyId = await getFamilyIdFromRequest(req, body);
    
    const bathLog = await prisma.bathLog.create({
      data: {
        ...body,
        time: timeUTC,
        caretakerId: authContext.caretakerId,
        soapUsed: body.soapUsed ?? true, // Default to true if not provided
        shampooUsed: body.shampooUsed ?? true, // Default to true if not provided
        ...(familyId && { familyId }), // Include family ID if available
      },
    });

    // Format dates as ISO strings for response
    const response: BathLogResponse = {
      ...bathLog,
      time: formatForResponse(bathLog.time) || '',
      createdAt: formatForResponse(bathLog.createdAt) || '',
      updatedAt: formatForResponse(bathLog.updatedAt) || '',
      deletedAt: formatForResponse(bathLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<BathLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating bath log:', error);
    return NextResponse.json<ApiResponse<BathLogResponse>>(
      {
        success: false,
        error: 'Failed to create bath log',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body: Partial<BathLogCreate> = await req.json();

    if (!id) {
      return NextResponse.json<ApiResponse<BathLogResponse>>(
        {
          success: false,
          error: 'Bath log ID is required',
        },
        { status: 400 }
      );
    }

    const existingBathLog = await prisma.bathLog.findUnique({
      where: { id },
    });

    if (!existingBathLog) {
      return NextResponse.json<ApiResponse<BathLogResponse>>(
        {
          success: false,
          error: 'Bath log not found',
        },
        { status: 404 }
      );
    }

    // Process date fields - convert to UTC
    const data = {
      ...(body.time ? { time: toUTC(body.time) } : {}),
      ...Object.entries(body)
        .filter(([key]) => !['time'].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    };

    const bathLog = await prisma.bathLog.update({
      where: { id },
      data,
    });

    // Format dates as ISO strings for response
    const response: BathLogResponse = {
      ...bathLog,
      time: formatForResponse(bathLog.time) || '',
      createdAt: formatForResponse(bathLog.createdAt) || '',
      updatedAt: formatForResponse(bathLog.updatedAt) || '',
      deletedAt: formatForResponse(bathLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<BathLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating bath log:', error);
    return NextResponse.json<ApiResponse<BathLogResponse>>(
      {
        success: false,
        error: 'Failed to update bath log',
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
    
    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);

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
      const bathLog = await prisma.bathLog.findUnique({
        where: { 
          id,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (!bathLog) {
        return NextResponse.json<ApiResponse<BathLogResponse>>(
          {
            success: false,
            error: 'Bath log not found',
          },
          { status: 404 }
        );
      }

      // Format dates as ISO strings for response
      const response: BathLogResponse = {
        ...bathLog,
        time: formatForResponse(bathLog.time) || '',
        createdAt: formatForResponse(bathLog.createdAt) || '',
        updatedAt: formatForResponse(bathLog.updatedAt) || '',
        deletedAt: formatForResponse(bathLog.deletedAt),
      };

      return NextResponse.json<ApiResponse<BathLogResponse>>({
        success: true,
        data: response,
      });
    }

    const bathLogs = await prisma.bathLog.findMany({
      where: queryParams,
      orderBy: {
        time: 'desc',
      },
    });

    // Format dates as ISO strings for response
    const response: BathLogResponse[] = bathLogs.map(bathLog => ({
      ...bathLog,
      time: formatForResponse(bathLog.time) || '',
      createdAt: formatForResponse(bathLog.createdAt) || '',
      updatedAt: formatForResponse(bathLog.updatedAt) || '',
      deletedAt: formatForResponse(bathLog.deletedAt),
    }));

    return NextResponse.json<ApiResponse<BathLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching bath logs:', error);
    return NextResponse.json<ApiResponse<BathLogResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch bath logs',
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
          error: 'Bath log ID is required',
        },
        { status: 400 }
      );
    }

    const existingBathLog = await prisma.bathLog.findUnique({
      where: { id },
    });

    if (!existingBathLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Bath log not found',
        },
        { status: 404 }
      );
    }

    await prisma.bathLog.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting bath log:', error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: 'Failed to delete bath log',
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
