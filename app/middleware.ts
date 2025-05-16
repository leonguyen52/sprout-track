import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from './api/db';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like images, etc.
  ) {
    return NextResponse.next();
  }
  
  // Extract the first path segment as potential family slug
  const segments = pathname.split('/').filter(Boolean);
  const potentialSlug = segments[0];
  
  // Skip middleware for setup, family-select, and API routes
  if (potentialSlug === 'setup' || potentialSlug === 'family-select' || potentialSlug === 'api') {
    return NextResponse.next();
  }
  
  // Check if we're accessing a non-slug app route directly (e.g., /log-entry instead of /[slug]/log-entry)
  // Always redirect these routes to their slug-based equivalents
  const appRoutes = ['log-entry', 'full-log', 'calendar'];
  if (appRoutes.includes(potentialSlug)) {
    // Count families to see if we have just one
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Family" WHERE "isActive" = true
    `;
    const familyCount = Number((countResult as any)[0]?.count || 0);
    
    if (familyCount === 1) {
      // If only one family exists, get its slug and redirect
      const families = await prisma.$queryRaw`
        SELECT slug FROM "Family" WHERE "isActive" = true LIMIT 1
      `;
      const familiesTyped = families as Array<{ slug: string }>;
      
      if (familiesTyped.length > 0) {
        const family = familiesTyped[0];
        // Redirect to the family slug
        const url = request.nextUrl.clone();
        url.pathname = `/${family.slug}/${potentialSlug}${pathname.substring(potentialSlug.length + 1)}`;
        return NextResponse.redirect(url);
      }
    } else if (familyCount > 1) {
      // Multiple families, redirect to family selection
      const url = request.nextUrl.clone();
      url.pathname = '/family-select';
      return NextResponse.redirect(url);
    }
  }
  
  // If no slug in URL, check if we need to redirect to a default family
  if (!potentialSlug) {
    // Count families to see if we have just one
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Family" WHERE "isActive" = true
    `;
    const familyCount = Number((countResult as any)[0]?.count || 0);
    
    if (familyCount === 1) {
      // If only one family exists, get its slug and redirect
      const families = await prisma.$queryRaw`
        SELECT slug FROM "Family" WHERE "isActive" = true LIMIT 1
      `;
      const familiesTyped = families as Array<{ slug: string }>;
      
      if (familiesTyped.length > 0) {
        const family = familiesTyped[0];
        // Redirect to the family slug
        const url = request.nextUrl.clone();
        url.pathname = `/${family.slug}${pathname === '/' ? '' : pathname}`;
        return NextResponse.redirect(url);
      }
    }
    
    // If multiple families or no families, let the root page handle it
    return NextResponse.next();
  }
  
  // Check if the slug is valid
  const families = await prisma.$queryRaw`
    SELECT id, name, slug FROM "Family" 
    WHERE slug = ${potentialSlug} AND "isActive" = true
    LIMIT 1
  `;
  const familiesTyped = families as Array<{ id: string; name: string; slug: string }>;
  const family = familiesTyped.length > 0 ? familiesTyped[0] : null;
  
  if (!family) {
    // If slug doesn't exist, redirect to root
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  // If slug is valid, add family info to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-family-id', family.id);
  requestHeaders.set('x-family-slug', family.slug);
  requestHeaders.set('x-family-name', family.name);
  
  // Continue with the modified request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except API routes, static files, etc.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
