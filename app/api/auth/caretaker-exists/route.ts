import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';

export async function GET(req: NextRequest) {
  try {
    // Count active caretakers (excluding system caretaker)
    const caretakerCount = await prisma.caretaker.count({
      where: {
        deletedAt: null,
        id: { not: 'system' }, // Exclude system caretaker
      },
    });

    return NextResponse.json<ApiResponse<{ exists: boolean }>>({
      success: true,
      data: {
        exists: caretakerCount > 0
      },
    });
  } catch (error) {
    console.error('Error checking caretakers:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to check caretakers',
      },
      { status: 500 }
    );
  }
}
