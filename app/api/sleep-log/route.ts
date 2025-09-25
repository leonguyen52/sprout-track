import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, SleepLogCreate, SleepLogResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse, calculateDurationMinutes, splitByMidnight, fromLocalToUTC } from '../utils/timezone';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId, caretakerId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const body: SleepLogCreate = await req.json();
    const clientTz = req.headers.get('x-user-timezone') || 'Asia/Bangkok';

    const baby = await prisma.baby.findFirst({
      where: { id: body.babyId, familyId: userFamilyId },
    });

    if (!baby) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Baby not found in this family.' }, { status: 404 });
    }
    
    // Convert times to UTC for storage. Interpret naive inputs as local time in provided timezone.
    const startTimeUTC = fromLocalToUTC(body.startTime, clientTz);
    const endTimeUTC = body.endTime ? fromLocalToUTC(body.endTime, clientTz) : null;
    
    // Calculate duration if both start and end times are present
    const duration = endTimeUTC ? calculateDurationMinutes(startTimeUTC, endTimeUTC) : undefined;

    // If both start and end provided, split across midnights in client timezone
    if (endTimeUTC) {
      const segments = splitByMidnight(startTimeUTC.toISOString(), endTimeUTC.toISOString(), clientTz);
      if (segments.length > 1) {
        const created = await Promise.all(segments.map(({ start, end }) => {
          const segDuration = calculateDurationMinutes(start, end);
          return prisma.sleepLog.create({
            data: {
              ...body,
              startTime: start,
              endTime: end,
              duration: segDuration,
              caretakerId: caretakerId,
              familyId: userFamilyId,
            }
          });
        }));

        const response: SleepLogResponse[] = created.map(sleepLog => ({
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
      }
    }

    const sleepLog = await prisma.sleepLog.create({
      data: {
        ...body,
        startTime: startTimeUTC,
        ...(endTimeUTC && { endTime: endTimeUTC }),
        duration,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });

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
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

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

    const existingSleepLog = await prisma.sleepLog.findFirst({
      where: { id, familyId: userFamilyId },
    });

    if (!existingSleepLog) {
      return NextResponse.json<ApiResponse<SleepLogResponse>>(
        {
          success: false,
          error: 'Sleep log not found or access denied',
        },
        { status: 404 }
      );
    }

    // Convert times to UTC for storage using client timezone if present
    const clientTz = req.headers.get('x-user-timezone') || 'Asia/Bangkok';
    const startTimeUTC = body.startTime ? fromLocalToUTC(body.startTime, clientTz) : undefined;
    const endTimeUTC = body.endTime ? fromLocalToUTC(body.endTime, clientTz) : undefined;
    
    // If providing an end time and it crosses midnight in client timezone, split.
    if (endTimeUTC) {
      const baseStart = startTimeUTC || existingSleepLog.startTime;
      const segments = splitByMidnight(baseStart.toISOString(), endTimeUTC.toISOString(), clientTz);
      if (segments.length > 1) {
        // Update current record to first segment
        const first = segments[0];
        const firstDuration = calculateDurationMinutes(first.start, first.end);
        const updated = await prisma.sleepLog.update({
          where: { id },
          data: {
            ...(body.type ? { type: body.type } : {}),
            ...(body.location !== undefined ? { location: body.location } : {}),
            ...(body.quality !== undefined ? { quality: body.quality } : {}),
            startTime: first.start,
            endTime: first.end,
            duration: firstDuration,
          },
        });

        // Create the rest segments as new records
        const created = await Promise.all(segments.slice(1).map(({ start, end }) => {
          const segDuration = calculateDurationMinutes(start, end);
          return prisma.sleepLog.create({
            data: {
              babyId: updated.babyId,
              familyId: updated.familyId,
              caretakerId: updated.caretakerId,
              type: body.type ?? updated.type,
              location: body.location ?? updated.location,
              quality: body.quality ?? updated.quality,
              startTime: start,
              endTime: end,
              duration: segDuration,
            }
          });
        }));

        const response: SleepLogResponse[] = [updated, ...created].map(sleepLog => ({
          ...sleepLog,
          startTime: formatForResponse(sleepLog.startTime) || '',
          endTime: formatForResponse(sleepLog.endTime) || null,
          createdAt: formatForResponse(sleepLog.createdAt) || '',
          updatedAt: formatForResponse(sleepLog.updatedAt) || '',
          deletedAt: formatForResponse(sleepLog.deletedAt),
        }));

        return NextResponse.json<ApiResponse<SleepLogResponse[]>>({ success: true, data: response });
      }
    }

    // No split required; proceed with normal update
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

    const response: SleepLogResponse = {
      ...sleepLog,
      startTime: formatForResponse(sleepLog.startTime) || '',
      endTime: formatForResponse(sleepLog.endTime) || null,
      createdAt: formatForResponse(sleepLog.createdAt) || '',
      updatedAt: formatForResponse(sleepLog.updatedAt) || '',
      deletedAt: formatForResponse(sleepLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<SleepLogResponse>>({ success: true, data: response });
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
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const babyId = searchParams.get('babyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const queryParams: any = {
      familyId: userFamilyId,
      ...(babyId && { babyId }),
      ...(startDate && endDate && {
        startTime: {
          gte: toUTC(startDate),
          lte: toUTC(endDate),
        },
      }),
    };

    if (id) {
      const sleepLog = await prisma.sleepLog.findFirst({
        where: { 
          id,
          familyId: userFamilyId,
        },
      });

      if (!sleepLog) {
        return NextResponse.json<ApiResponse<SleepLogResponse>>(
          {
            success: false,
            error: 'Sleep log not found or access denied',
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
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

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

    const existingSleepLog = await prisma.sleepLog.findFirst({
      where: { id, familyId: userFamilyId },
    });

    if (!existingSleepLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Sleep log not found or access denied',
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
