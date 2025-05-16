import { NextRequest } from 'next/server';

/**
 * Gets the family ID from the request headers
 * The family ID is set by the middleware based on the URL slug
 * 
 * @param req The Next.js request object
 * @returns The family ID or null if not found
 */
export function getFamilyIdFromRequest(req: NextRequest): string | null {
  const familyId = req.headers.get('x-family-id');
  return familyId;
}

/**
 * Gets the family slug from the request headers
 * The family slug is set by the middleware based on the URL
 * 
 * @param req The Next.js request object
 * @returns The family slug or null if not found
 */
export function getFamilySlugFromRequest(req: NextRequest): string | null {
  const familySlug = req.headers.get('x-family-slug');
  return familySlug;
}

/**
 * Gets the family name from the request headers
 * The family name is set by the middleware based on the URL slug
 * 
 * @param req The Next.js request object
 * @returns The family name or null if not found
 */
export function getFamilyNameFromRequest(req: NextRequest): string | null {
  const familyName = req.headers.get('x-family-name');
  return familyName;
}
