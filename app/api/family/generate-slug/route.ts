import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { generateSlug, generateSlugWithNumber } from '../../utils/slug-generator';
import { withAuth } from '../../utils/auth';
import type { ApiResponse } from '../../utils/auth';

/**
 * Generate a unique slug for a new family
 * Checks the database to ensure the slug doesn't already exist
 * 
 * @route GET /api/family/generate-slug
 * @returns {Object} JSON response with a unique slug
 */
async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<{ slug: string }>>> {
  try {
    // Try to generate a unique slug (max 10 attempts with basic slug)
    let slug = '';
    let isUnique = false;
    let attempts = 0;
    
    // First try with basic slugs (adjective-animal)
    while (!isUnique && attempts < 10) {
      slug = generateSlug();
      
      // Check if this slug already exists in the database
      // Use raw query to handle the case where the Family model might not be fully set up
      const existingFamilies = await prisma.$queryRaw`
        SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
      `;
      
      if (Array.isArray(existingFamilies) && existingFamilies.length === 0) {
        isUnique = true;
      }
      
      attempts++;
    }
    
    // If we couldn't find a unique basic slug, try with numeric suffix
    if (!isUnique) {
      attempts = 0;
      while (!isUnique && attempts < 10) {
        slug = generateSlugWithNumber();
        
        // Check if this slug already exists in the database
        const existingFamilies = await prisma.$queryRaw`
          SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
        `;
        
        if (Array.isArray(existingFamilies) && existingFamilies.length === 0) {
          isUnique = true;
        }
        
        attempts++;
      }
    }
    
    // If we still couldn't find a unique slug, increase the digit count
    if (!isUnique) {
      slug = generateSlugWithNumber(6); // Try with 6 digits
      
      // One final check
      const existingFamilies = await prisma.$queryRaw`
        SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
      `;
      
      if (!(Array.isArray(existingFamilies) && existingFamilies.length === 0)) {
        throw new Error('Unable to generate a unique slug after multiple attempts');
      }
    }
    
    // Return the unique slug
    return NextResponse.json({
      success: true,
      data: { slug }
    });
  } catch (error) {
    console.error('Error generating unique slug:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate unique slug',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Export the handler with authentication middleware
export const GET = withAuth(handler);
