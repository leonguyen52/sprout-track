import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../db';
import { ApiResponse, CaretakerResponse } from '../../../types';
import { formatForResponse } from '../../../utils/timezone';

// GET - Get all caretakers for a specific family
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CaretakerResponse[]>>> {
  try {
    const { id: familyId } = await params;

    if (!familyId) {
      return NextResponse.json({
        success: false,
        error: 'Family ID is required',
      }, { status: 400 });
    }

    // Check if family exists
    const family = await prisma.family.findUnique({
      where: { id: familyId }
    });

    if (!family) {
      return NextResponse.json({
        success: false,
        error: 'Family not found',
      }, { status: 404 });
    }

    // Get all caretakers for this family
    const caretakers = await prisma.caretaker.findMany({
      where: {
        familyId: familyId,
        deletedAt: null
      },
      orderBy: [
        { loginId: 'asc' }
      ]
    });

    // Format response
    const caretakerResponses: CaretakerResponse[] = caretakers.map((caretaker) => ({
      ...caretaker,
      createdAt: formatForResponse(caretaker.createdAt) || '',
      updatedAt: formatForResponse(caretaker.updatedAt) || '',
      deletedAt: formatForResponse(caretaker.deletedAt),
    }));

    return NextResponse.json({
      success: true,
      data: caretakerResponses,
    });
  } catch (error) {
    console.error('Error fetching caretakers for family:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch caretakers',
    }, { status: 500 });
  }
} 