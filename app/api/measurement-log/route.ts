import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, MeasurementCreate, MeasurementResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: MeasurementCreate = await req.json();
    
    // Convert date to UTC for storage
    const dateUTC = toUTC(body.date);
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);
    
    const measurement = await prisma.measurement.create({
      data: {
        ...body,
        date: dateUTC,
        caretakerId: authContext.caretakerId,
        ...(familyId && { familyId }), // Include family ID if available
      },
    });

    // Format dates as ISO strings for response
    const response: MeasurementResponse = {
      ...measurement,
      date: formatForResponse(measurement.date) || '',
      createdAt: formatForResponse(measurement.createdAt) || '',
      updatedAt: formatForResponse(measurement.updatedAt) || '',
      deletedAt: formatForResponse(measurement.deletedAt),
    };

    return NextResponse.json<ApiResponse<MeasurementResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating measurement:', error);
    return NextResponse.json<ApiResponse<MeasurementResponse>>(
      {
        success: false,
        error: 'Failed to create measurement',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body: Partial<MeasurementCreate> = await req.json();

    if (!id) {
      return NextResponse.json<ApiResponse<MeasurementResponse>>(
        {
          success: false,
          error: 'Measurement ID is required',
        },
        { status: 400 }
      );
    }

    const existingMeasurement = await prisma.measurement.findUnique({
      where: { id },
    });

    if (!existingMeasurement) {
      return NextResponse.json<ApiResponse<MeasurementResponse>>(
        {
          success: false,
          error: 'Measurement not found',
        },
        { status: 404 }
      );
    }

    // Convert date to UTC if provided
    const data = body.date
      ? { ...body, date: toUTC(body.date) }
      : body;

    const measurement = await prisma.measurement.update({
      where: { id },
      data,
    });

    // Format dates as ISO strings for response
    const response: MeasurementResponse = {
      ...measurement,
      date: formatForResponse(measurement.date) || '',
      createdAt: formatForResponse(measurement.createdAt) || '',
      updatedAt: formatForResponse(measurement.updatedAt) || '',
      deletedAt: formatForResponse(measurement.deletedAt),
    };

    return NextResponse.json<ApiResponse<MeasurementResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating measurement:', error);
    return NextResponse.json<ApiResponse<MeasurementResponse>>(
      {
        success: false,
        error: 'Failed to update measurement',
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
    const type = searchParams.get('type');
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);

    const queryParams: any = {
      ...(babyId && { babyId }),
      ...(type && { type }),
      ...(startDate && endDate && {
        date: {
          gte: toUTC(startDate),
          lte: toUTC(endDate),
        },
      }),
      ...(familyId && { familyId }), // Filter by family ID if available
    };

    if (id) {
      const measurement = await prisma.measurement.findUnique({
        where: { 
          id,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (!measurement) {
        return NextResponse.json<ApiResponse<MeasurementResponse>>(
          {
            success: false,
            error: 'Measurement not found',
          },
          { status: 404 }
        );
      }

      // Format dates as ISO strings for response
      const response: MeasurementResponse = {
        ...measurement,
        date: formatForResponse(measurement.date) || '',
        createdAt: formatForResponse(measurement.createdAt) || '',
        updatedAt: formatForResponse(measurement.updatedAt) || '',
        deletedAt: formatForResponse(measurement.deletedAt),
      };

      return NextResponse.json<ApiResponse<MeasurementResponse>>({
        success: true,
        data: response,
      });
    }

    const measurements = await prisma.measurement.findMany({
      where: queryParams,
      orderBy: {
        date: 'desc',
      },
      include: {
        baby: {
          select: {
            firstName: true,
            lastName: true,
            inactive: true,
          },
        },
        caretaker: {
          select: {
            name: true,
            type: true,
            inactive: true,
          },
        },
      },
    });

    // Format dates as ISO strings for response and transform to expected response format
    const response = measurements.map(measurement => {
      // Extract the measurement data without the relations
      const { baby, caretaker, ...measurementData } = measurement;
      
      // Create the properly formatted response
      return {
        ...measurementData,
        date: formatForResponse(measurement.date) || '',
        createdAt: formatForResponse(measurement.createdAt) || '',
        updatedAt: formatForResponse(measurement.updatedAt) || '',
        deletedAt: formatForResponse(measurement.deletedAt),
        // We could include baby and caretaker info here if needed
      } as MeasurementResponse;
    });

    return NextResponse.json<ApiResponse<MeasurementResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json<ApiResponse<MeasurementResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch measurements',
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
          error: 'Measurement ID is required',
        },
        { status: 400 }
      );
    }

    const existingMeasurement = await prisma.measurement.findUnique({
      where: { id },
    });

    if (!existingMeasurement) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Measurement not found',
        },
        { status: 404 }
      );
    }

    await prisma.measurement.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: 'Failed to delete measurement',
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
