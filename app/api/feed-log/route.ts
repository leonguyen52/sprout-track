import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, FeedLogCreate, FeedLogResponse } from '../types';
import { FeedType } from '@prisma/client';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: FeedLogCreate = await req.json();
    
    // Convert all dates to UTC for storage
    const timeUTC = toUTC(body.time);
    
    // Get family ID from request headers (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || (body as any).familyId;
    
    // Process startTime, endTime, and feedDuration if provided
    const data = {
      ...body,
      time: timeUTC,
      caretakerId: authContext.caretakerId,
      ...(body.startTime && { startTime: toUTC(body.startTime) }),
      ...(body.endTime && { endTime: toUTC(body.endTime) }),
      // Ensure feedDuration is properly included
      ...(body.feedDuration !== undefined && { feedDuration: body.feedDuration }),
      familyId: familyId || null, // Include family ID if available
    };
    
    const feedLog = await prisma.feedLog.create({
      data,
    });

    // Format dates as ISO strings for response
    const response: FeedLogResponse = {
      ...feedLog,
      time: formatForResponse(feedLog.time) || '',
      createdAt: formatForResponse(feedLog.createdAt) || '',
      updatedAt: formatForResponse(feedLog.updatedAt) || '',
      deletedAt: formatForResponse(feedLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<FeedLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating feed log:', error);
    return NextResponse.json<ApiResponse<FeedLogResponse>>(
      {
        success: false,
        error: 'Failed to create feed log',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body: Partial<FeedLogCreate> = await req.json();

    if (!id) {
      return NextResponse.json<ApiResponse<FeedLogResponse>>(
        {
          success: false,
          error: 'Feed log ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request headers (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || (body as any).familyId;

    // Check if feed log exists and belongs to the family
    const existingFeedLog = await prisma.feedLog.findUnique({
      where: { id },
    });

    if (!existingFeedLog) {
      return NextResponse.json<ApiResponse<FeedLogResponse>>(
        {
          success: false,
          error: 'Feed log not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingFeedLog.familyId !== familyId) {
      return NextResponse.json<ApiResponse<FeedLogResponse>>(
        {
          success: false,
          error: 'Feed log not found',
        },
        { status: 404 }
      );
    }

    // Process all date fields - convert to UTC
    const data = {
      ...(body.time ? { time: toUTC(body.time) } : {}),
      ...(body.startTime ? { startTime: toUTC(body.startTime) } : {}),
      ...(body.endTime ? { endTime: toUTC(body.endTime) } : {}),
      ...(body.feedDuration !== undefined ? { feedDuration: body.feedDuration } : {}),
      ...Object.entries(body)
        .filter(([key]) => !['time', 'startTime', 'endTime', 'feedDuration'].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      // Preserve existing familyId if not provided in update
      familyId: (body as any).familyId || existingFeedLog.familyId,
    };

    const feedLog = await prisma.feedLog.update({
      where: { id },
      data,
    });

    // Format dates as ISO strings for response
    const response: FeedLogResponse = {
      ...feedLog,
      time: formatForResponse(feedLog.time) || '',
      createdAt: formatForResponse(feedLog.createdAt) || '',
      updatedAt: formatForResponse(feedLog.updatedAt) || '',
      deletedAt: formatForResponse(feedLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<FeedLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating feed log:', error);
    return NextResponse.json<ApiResponse<FeedLogResponse>>(
      {
        success: false,
        error: 'Failed to update feed log',
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
    const typeParam = searchParams.get('type');
    
    // Get family ID from request headers or query params
    const familyId = await getFamilyIdFromRequest(req) || searchParams.get('familyId');

    const queryParams = {
      ...(babyId && { babyId }),
      ...(typeParam && { type: typeParam as FeedType }),
      ...(startDate && endDate && {
        time: {
          gte: toUTC(startDate),
          lte: toUTC(endDate),
        },
      }),
      ...(familyId && { familyId }), // Filter by family ID if available
    };

    if (id) {
      const feedLog = await prisma.feedLog.findFirst({
        where: { 
          id,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (!feedLog) {
        return NextResponse.json<ApiResponse<FeedLogResponse>>(
          {
            success: false,
            error: 'Feed log not found',
          },
          { status: 404 }
        );
      }

      // Format dates as ISO strings for response
      const response: FeedLogResponse = {
        ...feedLog,
        time: formatForResponse(feedLog.time) || '',
        createdAt: formatForResponse(feedLog.createdAt) || '',
        updatedAt: formatForResponse(feedLog.updatedAt) || '',
        deletedAt: formatForResponse(feedLog.deletedAt),
      };

      return NextResponse.json<ApiResponse<FeedLogResponse>>({
        success: true,
        data: response,
      });
    }

    const feedLogs = await prisma.feedLog.findMany({
      where: queryParams,
      orderBy: {
        time: 'desc',
      },
    });

    // Format dates as ISO strings for response
    const response: FeedLogResponse[] = feedLogs.map(feedLog => ({
      ...feedLog,
      time: formatForResponse(feedLog.time) || '',
      createdAt: formatForResponse(feedLog.createdAt) || '',
      updatedAt: formatForResponse(feedLog.updatedAt) || '',
      deletedAt: formatForResponse(feedLog.deletedAt),
    }));

    return NextResponse.json<ApiResponse<FeedLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching feed logs:', error);
    return NextResponse.json<ApiResponse<FeedLogResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch feed logs',
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
          error: 'Feed log ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request headers
    const familyId = await getFamilyIdFromRequest(req);

    // Check if feed log exists and belongs to the family
    const existingFeedLog = await prisma.feedLog.findUnique({
      where: { id },
    });

    if (!existingFeedLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Feed log not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingFeedLog.familyId !== familyId) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Feed log not found',
        },
        { status: 404 }
      );
    }

    await prisma.feedLog.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting feed log:', error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: 'Failed to delete feed log',
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
