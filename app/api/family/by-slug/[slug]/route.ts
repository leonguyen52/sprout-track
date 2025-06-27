import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { ApiResponse } from '@/app/api/utils/auth';
import { Family } from '@prisma/client';

// This endpoint doesn't require authentication as it's used for the initial family selection
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ApiResponse<Family | null>>> {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Family slug is required',
      }, { status: 400 });
    }
    
    const family = await prisma.family.findFirst({
      where: {
        slug: slug,
        isActive: true,
      },
    });
    
    if (!family) {
      // Return 200 OK with success: false to indicate the slug is available.
      // This avoids a 404 error in the browser console for a simple availability check.
      return NextResponse.json({ success: false, data: null }, { status: 200 });
    }
    
    // Return 200 OK with success: true to indicate slug is taken.
    return NextResponse.json({
      success: true,
      data: family,
    });
  } catch (error) {
    console.error('Error fetching family by slug:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch family',
      data: null,
    }, { status: 500 });
  }
}
