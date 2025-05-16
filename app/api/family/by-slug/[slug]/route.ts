import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../db';
import { ApiResponse, FamilyResponse } from '../../../types';

// This endpoint doesn't require authentication as it's used for the initial family selection
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse<ApiResponse<FamilyResponse>>> {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Family slug is required',
      }, { status: 400 });
    }
    
    // Use raw query to get family by slug
    const families = await prisma.$queryRaw`
      SELECT id, name, slug, "createdAt", "updatedAt", "isActive"
      FROM "Family"
      WHERE slug = ${slug} AND "isActive" = true
      LIMIT 1
    `;
    
    // Convert raw result to typed array
    const familiesTyped = families as Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      updatedAt: Date;
      isActive: boolean;
    }>;
    
    if (!familiesTyped.length) {
      return NextResponse.json({
        success: false,
        error: 'Family not found',
      }, { status: 404 });
    }
    
    const family = familiesTyped[0];
    
    // Convert dates to strings for JSON response
    const familyResponse: FamilyResponse = {
      id: family.id,
      name: family.name,
      slug: family.slug,
      isActive: family.isActive,
      createdAt: new Date(family.createdAt).toISOString(),
      updatedAt: new Date(family.updatedAt).toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      data: familyResponse,
    });
  } catch (error) {
    console.error('Error fetching family by slug:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch family',
    }, { status: 500 });
  }
}
