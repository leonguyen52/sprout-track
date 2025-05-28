import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, SleepLogResponse, FeedLogResponse, DiaperLogResponse, NoteResponse, BathLogResponse, PumpLogResponse, MilestoneResponse, MeasurementResponse, MedicineLogResponse, MedicineResponse } from '../types';
import { withAuth } from '../utils/auth';
import { toUTC, formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

// Extended activity types with caretaker information
type ActivityTypeWithCaretaker = (
  SleepLogResponse | FeedLogResponse | DiaperLogResponse | NoteResponse | BathLogResponse | PumpLogResponse | MilestoneResponse | MeasurementResponse | MedicineLogResponse
) & {
  caretakerId?: string | null;
  caretakerName?: string;
  medicine?: MedicineResponse;
};

type ActivityType = ActivityTypeWithCaretaker;

const getActivityTime = (activity: any): number => {
  // For activities with a simple time field (feed, diaper, note, bath)
  if ('time' in activity && activity.time) {
    return new Date(activity.time).getTime();
  }
  
  // For activities with startTime/endTime (sleep, pump)
  if ('startTime' in activity && activity.startTime) {
    // For sleep activities, use endTime if available
    if ('type' in activity && ['NAP', 'NIGHT'].includes(activity.type) && activity.endTime) {
      return new Date(activity.endTime).getTime();
    }
    // For pump activities, always use startTime for sorting
    if ('leftAmount' in activity || 'rightAmount' in activity || 'totalAmount' in activity) {
      return new Date(activity.startTime).getTime();
    }
    // Default to startTime for any other activities with startTime
    return new Date(activity.startTime).getTime();
  }
  
  // For activities with a date field (milestone, measurement)
  if ('date' in activity && activity.date) {
    return new Date(activity.date).getTime();
  }
  
  // Fallback
  return new Date().getTime();
};

async function handleGet(req: NextRequest) {
  try {
    // Get the full URL to debug
    const fullUrl = req.url;
    console.log(`Full request URL: ${fullUrl}`);
    
    const url = new URL(req.url);
    const { searchParams } = url;
    
    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);
    console.log(`Family ID from request: ${familyId || 'null'}`);
    
    // Log all search parameters for debugging
    console.log("All search parameters:");
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    
    const babyId = searchParams.get('babyId');
    const limit = Number(searchParams.get('limit')) || 200;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    // Get client timezone from query parameter - no longer needed with ISO strings
    const clientTimezone = searchParams.get('timezone');

    console.log(`API Request - babyId: ${babyId}, date: ${date}, startDate: ${startDate}, endDate: ${endDate}, timezone: ${clientTimezone}`);

    // If a single date is provided, create start and end dates for that day
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;
    let useLimit = true;
    
    if (date) {
      console.log(`Processing date parameter: ${date}`);
      try {
        // Parse the date string to ensure it's valid
        const selectedDate = new Date(date);
        
        if (!isNaN(selectedDate.getTime())) {
          // Set start date to beginning of the day in local time
          const dayStart = new Date(selectedDate);
          dayStart.setHours(0, 0, 0, 0);
          effectiveStartDate = dayStart.toISOString();
          
          // Set end date to end of the day in local time
          const dayEnd = new Date(selectedDate);
          dayEnd.setHours(23, 59, 59, 999);
          effectiveEndDate = dayEnd.toISOString();
          
          // Don't use limit when filtering by date
          useLimit = false;
          
          console.log(`Date range created: ${effectiveStartDate} to ${effectiveEndDate}`);
        } else {
          console.log(`Invalid date format: ${date}`);
        }
      } catch (error) {
        console.error(`Error processing date parameter: ${error}`);
      }
    } else if (startDate && endDate) {
      // Don't use limit when filtering by date range
      useLimit = false;
      console.log(`Using date range: ${startDate} to ${endDate}`);
    } else {
      console.log(`No date parameters provided, using limit: ${limit}`);
    }

    if (!babyId) {
      return NextResponse.json<ApiResponse<ActivityType[]>>(
        {
          success: false,
          error: 'Baby ID is required',
        },
        { status: 400 }
      );
    }

    // Log query parameters
    console.log(`Query parameters - useLimit: ${useLimit}, limit: ${limit}`);
    console.log(`Date filtering: ${effectiveStartDate ? 'Yes' : 'No'}`);
    console.log(`Effective start date: ${effectiveStartDate}`);
    console.log(`Effective end date: ${effectiveEndDate}`);
    
    // Convert date strings to UTC for database queries
    const startDateUTC = effectiveStartDate ? toUTC(effectiveStartDate) : undefined;
    const endDateUTC = effectiveEndDate ? toUTC(effectiveEndDate) : undefined;
    
    // Get recent activities from each type with caretaker information
    const [sleepLogs, feedLogs, diaperLogs, noteLogs, bathLogs, pumpLogs, milestoneLogs, measurementLogs, medicineLogs] = await Promise.all([
      prisma.sleepLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            OR: [
              // Sleep logs that start within the date range
              {
                startTime: {
                  gte: startDateUTC,
                  lte: endDateUTC
                }
              },
              // Sleep logs that end within the date range
              {
                endTime: {
                  gte: startDateUTC,
                  lte: endDateUTC
                }
              },
              // Sleep logs that span the date range
              {
                startTime: { lte: startDateUTC },
                endTime: { gte: endDateUTC }
              }
            ]
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { startTime: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.feedLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            time: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { time: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.diaperLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            time: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { time: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.note.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            time: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { time: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.bathLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            time: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { time: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.pumpLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            startTime: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { startTime: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.milestone.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            date: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { date: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.measurement.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            date: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true
        },
        orderBy: { date: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      }),
      prisma.medicineLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC ? {
            time: {
              gte: startDateUTC,
              lte: endDateUTC
            }
          } : {}),
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        include: {
          caretaker: true,
          medicine: true
        },
        orderBy: { time: 'desc' },
        ...(useLimit && limit ? { take: limit } : {})
      })
    ]);
    
    console.log(`Results - sleepLogs: ${sleepLogs.length}, feedLogs: ${feedLogs.length}, diaperLogs: ${diaperLogs.length}, noteLogs: ${noteLogs.length}, bathLogs: ${bathLogs.length}, pumpLogs: ${pumpLogs.length}`);

    // Format the responses with caretaker information
    const formattedSleepLogs: ActivityTypeWithCaretaker[] = sleepLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          startTime: formatForResponse(log.startTime) || '',
          endTime: formatForResponse(log.endTime) || null,
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });

    const formattedFeedLogs: ActivityTypeWithCaretaker[] = feedLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || '',
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });

    const formattedDiaperLogs: ActivityTypeWithCaretaker[] = diaperLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || '',
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });

    const formattedNoteLogs: ActivityTypeWithCaretaker[] = noteLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || '',
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });
      
    const formattedBathLogs: ActivityTypeWithCaretaker[] = bathLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || '',
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });
      
    const formattedPumpLogs: ActivityTypeWithCaretaker[] = pumpLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Get the unit from the unitAbbr field or default to 'oz', ensuring it's lowercase
        const unit = log.unitAbbr ? log.unitAbbr.toLowerCase() : 'oz';
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          startTime: formatForResponse(log.startTime) || '',
          endTime: formatForResponse(log.endTime) || null,
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
          unit: unit, // Explicitly include the unit in the response
        };
      });
      
    // Format medicine logs
    const formattedMedicineLogs: ActivityTypeWithCaretaker[] = medicineLogs
      .map(log => {
        const { caretaker, medicine, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || '',
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: caretaker ? caretaker.name : undefined,
          medicine: medicine ? {
            ...medicine,
            createdAt: formatForResponse(medicine.createdAt) || '',
            updatedAt: formatForResponse(medicine.updatedAt) || '',
            deletedAt: formatForResponse(medicine.deletedAt)
          } : undefined
        };
      });

    // Format milestone logs
    const formattedMilestoneLogs: ActivityTypeWithCaretaker[] = milestoneLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          date: formatForResponse(log.date) || '',
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });
      
    // Format measurement logs
    const formattedMeasurementLogs: ActivityTypeWithCaretaker[] = measurementLogs
      .map(log => {
        // Create a new object without the caretaker property
        const { caretaker, ...logWithoutCaretaker } = log;
        
        // Format dates as ISO strings
        return {
          ...logWithoutCaretaker,
          date: formatForResponse(log.date) || '',
          createdAt: formatForResponse(log.createdAt) || '',
          updatedAt: formatForResponse(log.updatedAt) || '',
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });

    // Combine and sort all activities
    const allActivities = [
      ...formattedSleepLogs,
      ...formattedFeedLogs,
      ...formattedDiaperLogs,
      ...formattedNoteLogs,
      ...formattedBathLogs,
      ...formattedPumpLogs,
      ...formattedMilestoneLogs,
      ...formattedMeasurementLogs,
      ...formattedMedicineLogs
    ]
    .sort((a, b) => getActivityTime(b) - getActivityTime(a));
    
    // Only apply the limit if we're not filtering by date
    const finalActivities = useLimit ? allActivities.slice(0, limit) : allActivities;
    
    console.log(`Final activities count: ${finalActivities.length}`);

    return NextResponse.json<ApiResponse<ActivityType[]>>({
      success: true,
      data: finalActivities
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json<ApiResponse<ActivityType[]>>(
      {
        success: false,
        error: 'Failed to fetch timeline',
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware to all handlers
// Use type assertions to handle the multiple return types
export const GET = withAuth(handleGet as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
