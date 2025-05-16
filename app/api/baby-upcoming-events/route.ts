import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { withAuth } from '../utils/auth';
import { formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get('babyId');
    const limit = Number(searchParams.get('limit')) || 5;
    
    // Get family ID from request headers
    const familyId = getFamilyIdFromRequest(req);
    
    if (!babyId) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: 'Baby ID is required'
      }, { status: 400 });
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
        ...(familyId && { familyId }), // Filter by family ID if available
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
export const GET = withAuth(handleGet as (req: NextRequest) => Promise<NextResponse<ApiResponse<any>>>);
