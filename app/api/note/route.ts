import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, NoteCreate, NoteResponse } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { toUTC, formatForResponse } from '../utils/timezone';
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: NoteCreate = await req.json();
    
    // Convert time to UTC for storage
    const timeUTC = toUTC(body.time);
    
    // Get family ID from request (body, query params, or URL slug)
    const familyId = await getFamilyIdFromRequest(req, body);
    
    const note = await prisma.note.create({
      data: {
        ...body,
        time: timeUTC,
        caretakerId: authContext.caretakerId,
        ...(familyId && { familyId }), // Include family ID if available
      },
    });

    // Format dates as ISO strings for response
    const response: NoteResponse = {
      ...note,
      time: formatForResponse(note.time) || '',
      createdAt: formatForResponse(note.createdAt) || '',
      updatedAt: formatForResponse(note.updatedAt) || '',
      deletedAt: formatForResponse(note.deletedAt),
    };

    return NextResponse.json<ApiResponse<NoteResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json<ApiResponse<NoteResponse>>(
      {
        success: false,
        error: 'Failed to create note',
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body: Partial<NoteCreate> = await req.json();

    if (!id) {
      return NextResponse.json<ApiResponse<NoteResponse>>(
        {
          success: false,
          error: 'Note ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);

    const existingNote = await prisma.note.findUnique({
      where: {
        id,
        ...(familyId && { familyId }),
      },
    });

    if (!existingNote) {
      return NextResponse.json<ApiResponse<NoteResponse>>(
        {
          success: false,
          error: 'Note not found',
        },
        { status: 404 }
      );
    }

    // Convert time to UTC if provided
    const data = body.time
      ? { ...body, time: toUTC(body.time) }
      : body;

    const note = await prisma.note.update({
      where: {
        id,
        ...(familyId && { familyId }),
      },
      data,
    });

    // Format dates as ISO strings for response
    const response: NoteResponse = {
      ...note,
      time: formatForResponse(note.time) || '',
      createdAt: formatForResponse(note.createdAt) || '',
      updatedAt: formatForResponse(note.updatedAt) || '',
      deletedAt: formatForResponse(note.deletedAt),
    };

    return NextResponse.json<ApiResponse<NoteResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json<ApiResponse<NoteResponse>>(
      {
        success: false,
        error: 'Failed to update note',
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
    const categories = searchParams.get('categories');
    
    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);

    // If categories flag is present, return unique categories
    if (categories === 'true') {
      const notes = await prisma.note.findMany({
        where: {
          category: {
            not: null
          },
          ...(familyId && { familyId }), // Filter by family ID if available
        },
        distinct: ['category'],
        select: {
          category: true
        }
      });
      
      const uniqueCategories = notes
        .map(note => note.category)
        .filter((category): category is string => category !== null);

      return NextResponse.json<ApiResponse<string[]>>({
        success: true,
        data: uniqueCategories
      });
    }

    const queryParams = {
      ...(babyId && { babyId }),
      ...(startDate && endDate && {
        time: {
          gte: toUTC(startDate),
          lte: toUTC(endDate),
        },
      }),
      ...(familyId && { familyId }), // Filter by family ID if available
    };

    if (id) {
      const note = await prisma.note.findUnique({
        where: { 
          id,
          ...(familyId && { familyId }), // Filter by family ID if available
        },
      });

      if (!note) {
        return NextResponse.json<ApiResponse<NoteResponse>>(
          {
            success: false,
            error: 'Note not found',
          },
          { status: 404 }
        );
      }

      // Format dates as ISO strings for response
      const response: NoteResponse = {
        ...note,
        time: formatForResponse(note.time) || '',
        createdAt: formatForResponse(note.createdAt) || '',
        updatedAt: formatForResponse(note.updatedAt) || '',
        deletedAt: formatForResponse(note.deletedAt),
      };

      return NextResponse.json<ApiResponse<NoteResponse>>({
        success: true,
        data: response,
      });
    }

    const notes = await prisma.note.findMany({
      where: queryParams,
      orderBy: {
        time: 'desc',
      },
    });

    // Format dates as ISO strings for response
    const response: NoteResponse[] = notes.map(note => ({
      ...note,
      time: formatForResponse(note.time) || '',
      createdAt: formatForResponse(note.createdAt) || '',
      updatedAt: formatForResponse(note.updatedAt) || '',
      deletedAt: formatForResponse(note.deletedAt),
    }));

    return NextResponse.json<ApiResponse<NoteResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json<ApiResponse<NoteResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch notes',
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
          error: 'Note ID is required',
        },
        { status: 400 }
      );
    }

    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);

    const existingNote = await prisma.note.findFirst({
      where: { 
        id,
        ...(familyId && { familyId }),
      },
    });

    if (!existingNote) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: 'Note not found',
        },
        { status: 404 }
      );
    }

    await prisma.note.delete({
      where: { 
        id,
      },
    });

    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: 'Failed to delete note',
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
