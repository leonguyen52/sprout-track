import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { formatForResponse } from '../utils/timezone';

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get('babyId');
    const limit = Number(searchParams.get('limit')) || 5;

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
    
    // Get current date in UTC
    const now = new Date();
    
    // Get upcoming events
    const events = await prisma.calendarEvent.findMany({
      where: {
        babies: {
          some: {
            babyId
          }
        },
        startTime: {
          gte: now
        },
        deletedAt: null,
        familyId: userFamilyId, // Filter by family ID from context
      },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        caretakers: {
          include: {
            caretaker: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        contacts: {
          include: {
            contact: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: limit
    });
    
    // Format the response
    const formattedEvents = events.map(event => ({
      ...event,
      startTime: formatForResponse(event.startTime) || '',
      endTime: formatForResponse(event.endTime),
      recurrenceEnd: formatForResponse(event.recurrenceEnd),
      createdAt: formatForResponse(event.createdAt) || '',
      updatedAt: formatForResponse(event.updatedAt) || '',
      deletedAt: formatForResponse(event.deletedAt),
      babies: event.babies.map(be => be.baby),
      caretakers: event.caretakers.map(ce => ce.caretaker),
      contacts: event.contacts.map(ce => ce.contact)
    }));
    
    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: 'Failed to fetch upcoming events'
    }, { status: 500 });
  }
}

// Apply authentication middleware to all handlers
export const GET = withAuthContext(handleGet);
