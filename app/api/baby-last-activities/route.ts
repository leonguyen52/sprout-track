import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { withAuth } from '../utils/auth';
import { formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

// Helper function to get the most recent measurement of a specific type
const getMeasurementByType = (measurements: any[], type: string) => {
  const measurement = measurements.find(m => m.type === type);
  if (!measurement) return null;
  
  return {
    ...measurement,
    date: formatForResponse(measurement.date) || '',
    caretakerName: measurement.caretaker?.name
  };
};

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get('babyId');
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);
    
    if (!babyId) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: 'Baby ID is required'
      }, { status: 400 });
    }
    
    // Get the most recent activity of each type
    const [lastDiaper, lastPoopDiaper, lastBath, measurements, lastNote] = await Promise.all([
      prisma.diaperLog.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        orderBy: { time: 'desc' },
        include: { caretaker: true }
      }),
      prisma.diaperLog.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          type: { in: ['DIRTY', 'BOTH'] },
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        orderBy: { time: 'desc' },
        include: { caretaker: true }
      }),
      prisma.bathLog.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        orderBy: { time: 'desc' },
        include: { caretaker: true }
      }),
      prisma.measurement.findMany({
        where: { 
          babyId, 
          deletedAt: null,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        orderBy: { date: 'desc' },
        include: { caretaker: true }
      }),
      prisma.note.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        orderBy: { time: 'desc' },
        include: { caretaker: true }
      })
    ]);
    
    // Format the response
    const response = {
      lastDiaper: lastDiaper ? {
        ...lastDiaper,
        time: formatForResponse(lastDiaper.time) || '',
        caretakerName: lastDiaper.caretaker?.name
      } : null,
      lastPoopDiaper: lastPoopDiaper ? {
        ...lastPoopDiaper,
        time: formatForResponse(lastPoopDiaper.time) || '',
        caretakerName: lastPoopDiaper.caretaker?.name
      } : null,
      lastBath: lastBath ? {
        ...lastBath,
        time: formatForResponse(lastBath.time) || '',
        caretakerName: lastBath.caretaker?.name
      } : null,
      lastMeasurements: {
        height: getMeasurementByType(measurements, 'HEIGHT'),
        weight: getMeasurementByType(measurements, 'WEIGHT'),
        headCircumference: getMeasurementByType(measurements, 'HEAD_CIRCUMFERENCE')
      },
      lastNote: lastNote ? {
        ...lastNote,
        time: formatForResponse(lastNote.time) || '',
        caretakerName: lastNote.caretaker?.name
      } : null
    };
    
    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching last activities:', error);
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: 'Failed to fetch last activities'
    }, { status: 500 });
  }
}

// Apply authentication middleware to all handlers
export const GET = withAuth(handleGet as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
