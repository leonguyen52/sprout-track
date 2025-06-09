import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { formatForResponse } from '../utils/timezone';

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

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get('babyId');
    
    if (!babyId) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: 'Baby ID is required'
      }, { status: 400 });
    }
    
    // Verify that the baby belongs to the caretaker's family
    const baby = await prisma.baby.findFirst({
        where: { id: babyId, familyId: userFamilyId },
    });

    if (!baby) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Baby not found in this family." },
            { status: 404 }
        );
    }
    
    // Get the most recent activity of each type
    const [lastDiaper, lastPoopDiaper, lastBath, measurements, lastNote] = await Promise.all([
      prisma.diaperLog.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          familyId: userFamilyId,
        },
        orderBy: { time: 'desc' },
        include: { caretaker: true }
      }),
      prisma.diaperLog.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          type: { in: ['DIRTY', 'BOTH'] },
          familyId: userFamilyId,
        },
        orderBy: { time: 'desc' },
        include: { caretaker: true }
      }),
      prisma.bathLog.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          familyId: userFamilyId,
        },
        orderBy: { time: 'desc' },
        include: { caretaker: true }
      }),
      prisma.measurement.findMany({
        where: { 
          babyId, 
          deletedAt: null,
          familyId: userFamilyId,
        },
        orderBy: { date: 'desc' },
        include: { caretaker: true }
      }),
      prisma.note.findFirst({
        where: { 
          babyId, 
          deletedAt: null,
          familyId: userFamilyId,
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
export const GET = withAuthContext(handleGet);
