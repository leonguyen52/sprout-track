import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, SleepLogCreate, SleepLogResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse, calculateDurationMinutes } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: SleepLogCreate = await req.json();
    
    // Convert times to UTC for storage
    const startTimeUTC = toUTC(body.startTime);
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : null;
    
    // Get family ID from request (body, query params, or URL slug)
    const familyId = await getFamilyIdFromRequest(req, body);
    
    // Calculate duration if both start and end times are present
    const duration = endTimeUTC ? calculateDurationMinutes(startTimeUTC, endTimeUTC) : undefined;

    const sleepLog = await prisma.sleepLog.create({
      data: {
        ...body,
        startTime: startTimeUTC,
        ...(endTimeUTC && { endTime: endTimeUTC }),
        duration,
        caretakerId: authContext.caretakerId,
        ...(familyId && { familyId }), // Include family ID if available
      },
    });

    // Format dates as ISO strings for response
    const response: SleepLogResponse = {
      ...sleepLog,
      startTime: formatForResponse(sleepLog.startTime) || '',
      endTime: formatForResponse(sleepLog.endTime) || null,
      createdAt: formatForResponse(sleepLog.createdAt) || '',
      updatedAt: formatForResponse(sleepLog.updatedAt) || '',
      deletedAt: formatForResponse(sleepLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<SleepLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating sleep log:', error);
    return NextResponse.json<ApiResponse<SleepLogResponse>>(
      {
        success: false,
        error: 'Failed to create sleep log',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body: Partial<SleepLogCreate> = await req.json();

    if (!id) {
      return NextResponse.json<ApiResponse<SleepLogResponse>>(
        {
          success: false,
          error: 'Sleep log ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);

    const existingSleepLog = await prisma.sleepLog.findFirst({
      where: { id, ...(familyId && { familyId }) },
    });

    if (!existingSleepLog) {
      return NextResponse.json<ApiResponse<SleepLogResponse>>(
        {
          success: false,
          error: 'Sleep log not found',
        },
        { status: 404 }
      );
    }

    // Convert times to UTC for storage
    const startTimeUTC = body.startTime ? toUTC(body.startTime) : undefined;
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : undefined;
    
    // Calculate duration if end time is provided
    const duration = endTimeUTC 
      ? calculateDurationMinutes(startTimeUTC || existingSleepLog.startTime, endTimeUTC) 
      : undefined;

    const sleepLog = await prisma.sleepLog.update({
      where: { id },
      data: {
        ...body,
        ...(startTimeUTC && { startTime: startTimeUTC }),
        ...(endTimeUTC && { endTime: endTimeUTC }),
        ...(duration !== undefined && { duration }),
      },
    });

    // Format dates as ISO strings for response
    const response: SleepLogResponse = {
      ...sleepLog,
      startTime: formatForResponse(sleepLog.startTime) || '',
      endTime: formatForResponse(sleepLog.endTime) || null,
      createdAt: formatForResponse(sleepLog.createdAt) || '',
      updatedAt: formatForResponse(sleepLog.updatedAt) || '',
      deletedAt: formatForResponse(sleepLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<SleepLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating sleep log:', error);
    return NextResponse.json<ApiResponse<SleepLogResponse>>(
      {
        success: false,
        error: 'Failed to update sleep log',
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
        startTime: {
          gte: toUTC(startDate),
          lte: toUTC(endDate),
        },
      }),
      ...(familyId && { familyId }), // Filter by family ID if available
    };

    if (id) {
      const sleepLog = await prisma.sleepLog.findFirst({
        where: { 
          id,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (!sleepLog) {
        return NextResponse.json<ApiResponse<SleepLogResponse>>(
          {
            success: false,
            error: 'Sleep log not found',
          },
          { status: 404 }
        );
      }

      // Format dates as ISO strings for response
      const response: SleepLogResponse = {
        ...sleepLog,
        startTime: formatForResponse(sleepLog.startTime) || '',
        endTime: formatForResponse(sleepLog.endTime) || null,
        createdAt: formatForResponse(sleepLog.createdAt) || '',
        updatedAt: formatForResponse(sleepLog.updatedAt) || '',
        deletedAt: formatForResponse(sleepLog.deletedAt),
      };

      return NextResponse.json<ApiResponse<SleepLogResponse>>({
        success: true,
        data: response,
      });
    }

    const sleepLogs = await prisma.sleepLog.findMany({
      where: queryParams,
      orderBy: {
        startTime: 'desc',
      },
    });

    // Format dates as ISO strings for response
    const response: SleepLogResponse[] = sleepLogs.map(sleepLog => ({
      ...sleepLog,
      startTime: formatForResponse(sleepLog.startTime) || '',
      endTime: formatForResponse(sleepLog.endTime) || null,
      createdAt: formatForResponse(sleepLog.createdAt) || '',
      updatedAt: formatForResponse(sleepLog.updatedAt) || '',
      deletedAt: formatForResponse(sleepLog.deletedAt),
    }));

    return NextResponse.json<ApiResponse<SleepLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching sleep logs:', error);
    return NextResponse.json<ApiResponse<SleepLogResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch sleep logs',
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
          error: 'Sleep log ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);

    const existingSleepLog = await prisma.sleepLog.findFirst({
      where: { id, ...(familyId && { familyId }) },
    });

    if (!existingSleepLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Sleep log not found',
        },
        { status: 404 }
      );
    }

    await prisma.sleepLog.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting sleep log:', error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: 'Failed to delete sleep log',
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
