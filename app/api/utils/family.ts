import { NextRequest } from 'next/server';
import prisma from '../db';

/**
 * Gets the family ID from the request
 * First tries to get from query parameters or request body, then from the URL slug
 * 
 * @param req The Next.js request object
 * @param requestBody Optional request body that might contain familyId
 * @returns The family ID or null if not found
 */
export async function getFamilyIdFromRequest(req: NextRequest, requestBody?: any): Promise<string | null> {
  // First, try to get family ID from query parameters
  const { searchParams } = new URL(req.url);
  const familyIdFromQuery = searchParams.get('familyId');
  if (familyIdFromQuery) {
    return familyIdFromQuery;
  }

  // Second, try to get family ID from request body
  if (requestBody && requestBody.familyId) {
    return requestBody.familyId;
  }

  // Third, try to extract family slug from URL path and look up family ID
  const slug = getFamilySlugFromRequest(req);
  if (!slug) {
    return null;
  }
  
  try {
    // Use raw query similar to the family API for consistency
    const families = await prisma.$queryRaw`
      SELECT id FROM "Family" 
      WHERE slug = ${slug} AND "isActive" = true 
      LIMIT 1
    `;
    
    const familiesTyped = families as Array<{ id: string }>;
    return familiesTyped.length > 0 ? familiesTyped[0].id : null;
  } catch (error) {
    console.error('Error looking up family by slug:', error);
    return null;
  }
}

/**
 * Gets the family slug from the request URL path
 * 
 * @param req The Next.js request object
 * @returns The family slug or null if not found
 */
export function getFamilySlugFromRequest(req: NextRequest): string | null {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split('/').filter(Boolean);
  
  // Skip API routes and other non-family paths
  if (segments[0] === 'api' || segments[0] === '_next') {
    return null;
  }
  
  // The family slug should be the first segment for app routes
  return segments[0] || null;
}

/**
 * Gets the family information from the request
 * 
 * @param req The Next.js request object
 * @param requestBody Optional request body that might contain familyId
 * @returns The family information or null if not found
 */
export async function getFamilyFromRequest(req: NextRequest, requestBody?: any): Promise<{ id: string; name: string; slug: string } | null> {
  const familyId = await getFamilyIdFromRequest(req, requestBody);
  
  if (!familyId) {
    // Try to get by slug if no ID found
    const slug = getFamilySlugFromRequest(req);
    if (!slug) {
      return null;
    }
    
    try {
      // Use raw query similar to the family API for consistency
      const families = await prisma.$queryRaw`
        SELECT id, name, slug FROM "Family" 
        WHERE slug = ${slug} AND "isActive" = true 
        LIMIT 1
      `;
      
      const familiesTyped = families as Array<{ id: string; name: string; slug: string }>;
      return familiesTyped.length > 0 ? familiesTyped[0] : null;
    } catch (error) {
      console.error('Error looking up family by slug:', error);
      return null;
    }
  }
  
  try {
    // Use raw query similar to the family API for consistency
    const families = await prisma.$queryRaw`
      SELECT id, name, slug FROM "Family" 
      WHERE id = ${familyId} AND "isActive" = true 
      LIMIT 1
    `;
    
    const familiesTyped = families as Array<{ id: string; name: string; slug: string }>;
    return familiesTyped.length > 0 ? familiesTyped[0] : null;
  } catch (error) {
    console.error('Error looking up family by ID:', error);
    return null;
  }
}

/**
 * Legacy function for backward compatibility
 * Gets the family name from the request headers (deprecated)
 * 
 * @param req The Next.js request object
 * @returns The family name or null if not found
 */
export function getFamilyNameFromRequest(req: NextRequest): string | null {
  const familyName = req.headers.get('x-family-name');
  return familyName;
}
