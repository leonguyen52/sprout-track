import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { CalendarEventType, RecurrencePattern } from '@prisma/client';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

// Type for calendar event response
interface CalendarEventResponse {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  type: CalendarEventType;
  location: string | null;
  color: string | null;
  recurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  recurrenceEnd: string | null;
  customRecurrence: string | null;
  reminderTime: number | null;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  familyId: string | null;
  babies: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  caretakers: Array<{
    id: string;
    name: string;
    type: string | null;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    role: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  }>;
}

// Type for calendar event create/update
interface CalendarEventCreate {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  allDay: boolean;
  type: CalendarEventType;
  location?: string;
  color?: string;
  recurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEnd?: string;
  customRecurrence?: string;
  reminderTime?: number;
  babyIds: string[];
  caretakerIds: string[];
  contactIds: string[];
  familyId?: string;
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const babyId = searchParams.get('babyId');
    const caretakerId = searchParams.get('caretakerId');
    const contactId = searchParams.get('contactId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const typeParam = searchParams.get('type');
    const recurringParam = searchParams.get('recurring');

    // Get family ID from request
    const familyId = await getFamilyIdFromRequest(req);

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    // Add family filter if available
    if (familyId) {
      where.familyId = familyId;
    }

    // Add filters
    if (id) {
      where.id = id;
    }

    if (babyId) {
      where.babies = {
        some: {
          babyId,
        },
      };
    }

    if (caretakerId) {
      where.caretakers = {
        some: {
          caretakerId,
        },
      };
    }

    if (contactId) {
      where.contacts = {
        some: {
          contactId,
        },
      };
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: toUTC(startDate),
        lte: toUTC(endDate),
      };
    }

    if (typeParam && Object.values(CalendarEventType).includes(typeParam as CalendarEventType)) {
      where.type = typeParam;
    }

    if (recurringParam !== null && ['true', 'false'].includes(recurringParam as string)) {
      where.recurring = recurringParam === 'true';
    }

    // If ID is provided, fetch a single event
    if (id) {
      const event = await prisma.calendarEvent.findUnique({
        where: { id },
        include: {
          babies: {
            include: {
              baby: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          caretakers: {
            include: {
              caretaker: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          contacts: {
            include: {
              contact: true,
            },
          },
        },
      });

      if (!event || event.deletedAt) {
        return NextResponse.json<ApiResponse<CalendarEventResponse>>(
          {
            success: false,
            error: 'Calendar event not found',
          },
          { status: 404 }
        );
      }

      // Check family access
      if (familyId && event.familyId !== familyId) {
        return NextResponse.json<ApiResponse<CalendarEventResponse>>(
          {
            success: false,
            error: 'Calendar event not found',
          },
          { status: 404 }
        );
      }

      // Format dates and transform related entities
      const response: CalendarEventResponse = {
        ...event,
        startTime: formatForResponse(event.startTime) || '',
        endTime: formatForResponse(event.endTime),
        recurrenceEnd: formatForResponse(event.recurrenceEnd),
        createdAt: formatForResponse(event.createdAt) || '',
        updatedAt: formatForResponse(event.updatedAt) || '',
        deletedAt: formatForResponse(event.deletedAt),
        babies: event.babies.map(be => be.baby),
        caretakers: event.caretakers.map(ce => ce.caretaker),
        contacts: event.contacts.map(ce => ce.contact),
      };

      return NextResponse.json<ApiResponse<CalendarEventResponse>>({
        success: true,
        data: response,
      });
    }

    // Fetch multiple events
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        caretakers: {
          include: {
            caretaker: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Format dates and transform related entities
    const response: CalendarEventResponse[] = events.map(event => ({
      ...event,
      startTime: formatForResponse(event.startTime) || '',
      endTime: formatForResponse(event.endTime),
      recurrenceEnd: formatForResponse(event.recurrenceEnd),
      createdAt: formatForResponse(event.createdAt) || '',
      updatedAt: formatForResponse(event.updatedAt) || '',
      deletedAt: formatForResponse(event.deletedAt),
      babies: event.babies.map(be => be.baby),
      caretakers: event.caretakers.map(ce => ce.caretaker),
      contacts: event.contacts.map(ce => ce.contact),
    }));

    return NextResponse.json<ApiResponse<CalendarEventResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json<ApiResponse<CalendarEventResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch calendar events',
      },
      { status: 500 }
    );
  }
}

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: CalendarEventCreate = await req.json();
    
    // Validate required fields
    if (!body.title || !body.startTime || body.type === undefined || body.allDay === undefined) {
      return NextResponse.json<ApiResponse<CalendarEventResponse>>(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Get family ID from request (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || body.familyId;
    
    // Convert dates to UTC for storage
    const startTimeUTC = toUTC(body.startTime);
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : undefined;
    const recurrenceEndUTC = body.recurrenceEnd ? toUTC(body.recurrenceEnd) : undefined;
    
    // Create event
    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        description: body.description || null,
        startTime: startTimeUTC,
        endTime: endTimeUTC || null,
        allDay: body.allDay,
        type: body.type,
        location: body.location || null,
        color: body.color || null,
        recurring: body.recurring,
        recurrencePattern: body.recurrencePattern || null,
        recurrenceEnd: recurrenceEndUTC || null,
        customRecurrence: body.customRecurrence || null,
        reminderTime: body.reminderTime || null,
        notificationSent: false,
        familyId: familyId || null,
        
        // Create relationships
        babies: {
          create: (body.babyIds || []).map(babyId => ({
            baby: { connect: { id: babyId } },
          })),
        },
        caretakers: {
          create: (body.caretakerIds || []).map(caretakerId => ({
            caretaker: { connect: { id: caretakerId } },
          })),
        },
        contacts: {
          create: (body.contactIds || []).map(contactId => ({
            contact: { connect: { id: contactId } },
          })),
        },
      },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        caretakers: {
          include: {
            caretaker: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
      },
    });
    
    // Format dates and transform related entities
    const response: CalendarEventResponse = {
      ...event,
      startTime: formatForResponse(event.startTime) || '',
      endTime: formatForResponse(event.endTime),
      recurrenceEnd: formatForResponse(event.recurrenceEnd),
      createdAt: formatForResponse(event.createdAt) || '',
      updatedAt: formatForResponse(event.updatedAt) || '',
      deletedAt: formatForResponse(event.deletedAt),
      babies: event.babies.map(be => be.baby),
      caretakers: event.caretakers.map(ce => ce.caretaker),
      contacts: event.contacts.map(ce => ce.contact),
    };
    
    return NextResponse.json<ApiResponse<CalendarEventResponse>>({
      success: true,
      data: response,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json<ApiResponse<CalendarEventResponse>>(
      {
        success: false,
        error: 'Failed to create calendar event',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body: CalendarEventCreate = await req.json();
    
    if (!id) {
      return NextResponse.json<ApiResponse<CalendarEventResponse>>(
        {
          success: false,
          error: 'Calendar event ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request (with fallback to body)
    const familyId = await getFamilyIdFromRequest(req) || body.familyId;
    
    // Check if event exists and belongs to the family
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });
    
    if (!existingEvent || existingEvent.deletedAt) {
      return NextResponse.json<ApiResponse<CalendarEventResponse>>(
        {
          success: false,
          error: 'Calendar event not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingEvent.familyId !== familyId) {
      return NextResponse.json<ApiResponse<CalendarEventResponse>>(
        {
          success: false,
          error: 'Calendar event not found',
        },
        { status: 404 }
      );
    }
    
    // Convert dates to UTC for storage
    const startTimeUTC = toUTC(body.startTime);
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : undefined;
    const recurrenceEndUTC = body.recurrenceEnd ? toUTC(body.recurrenceEnd) : undefined;
    
    // Update event in a transaction to handle relationships
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Delete existing relationships
      await tx.babyEvent.deleteMany({ where: { eventId: id } });
      await tx.caretakerEvent.deleteMany({ where: { eventId: id } });
      await tx.contactEvent.deleteMany({ where: { eventId: id } });
      
      // Update event
      const updated = await tx.calendarEvent.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description || null,
          startTime: startTimeUTC,
          endTime: endTimeUTC || null,
          allDay: body.allDay,
          type: body.type,
          location: body.location || null,
          color: body.color || null,
          recurring: body.recurring,
          recurrencePattern: body.recurrencePattern || null,
          recurrenceEnd: recurrenceEndUTC || null,
          customRecurrence: body.customRecurrence || null,
          reminderTime: body.reminderTime || null,
          familyId: familyId || existingEvent.familyId, // Preserve existing familyId if not provided
          
          // Create new relationships
          babies: {
            create: (body.babyIds || []).map(babyId => ({
              baby: { connect: { id: babyId } },
            })),
          },
          caretakers: {
            create: (body.caretakerIds || []).map(caretakerId => ({
              caretaker: { connect: { id: caretakerId } },
            })),
          },
          contacts: {
            create: (body.contactIds || []).map(contactId => ({
              contact: { connect: { id: contactId } },
            })),
          },
        },
        include: {
          babies: {
            include: {
              baby: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          caretakers: {
            include: {
              caretaker: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          contacts: {
            include: {
              contact: true,
            },
          },
        },
      });
      
      return updated;
    });
    
    // Format dates and transform related entities
    const response: CalendarEventResponse = {
      ...updatedEvent,
      startTime: formatForResponse(updatedEvent.startTime) || '',
      endTime: formatForResponse(updatedEvent.endTime),
      recurrenceEnd: formatForResponse(updatedEvent.recurrenceEnd),
      createdAt: formatForResponse(updatedEvent.createdAt) || '',
      updatedAt: formatForResponse(updatedEvent.updatedAt) || '',
      deletedAt: formatForResponse(updatedEvent.deletedAt),
      babies: updatedEvent.babies.map(be => be.baby),
      caretakers: updatedEvent.caretakers.map(ce => ce.caretaker),
      contacts: updatedEvent.contacts.map(ce => ce.contact),
    };
    
    return NextResponse.json<ApiResponse<CalendarEventResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json<ApiResponse<CalendarEventResponse>>(
      {
        success: false,
        error: 'Failed to update calendar event',
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
          error: 'Calendar event ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request
    const familyId = await getFamilyIdFromRequest(req);
    
    // Check if event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });
    
    if (!existingEvent) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Calendar event not found',
        },
        { status: 404 }
      );
    }

    // Check family access
    if (familyId && existingEvent.familyId !== familyId) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Calendar event not found',
        },
        { status: 404 }
      );
    }
    
    // Allow deleting even if it's already marked as deleted
    // This prevents errors when trying to delete an event multiple times
    
    // Soft delete the event
    await prisma.calendarEvent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
    
    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: 'Failed to delete calendar event',
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
