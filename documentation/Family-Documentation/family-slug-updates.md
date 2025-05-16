# Family Slug Updates

## Implementation Progress

We've implemented the following components to support multi-family functionality with URL slugs:

### 1. Database Schema
- Added `Family` model with relationships to all relevant models
- Added `familyId` field to all models that store family-specific data
- Created migration scripts to update existing data

### 2. API Routes
- Created `app/api/family/by-slug/[slug]/route.ts` to fetch family data by slug
- Created `app/api/family/public-list/route.ts` to list all families without authentication
- Updated API routes to use raw SQL queries for Family table access

### 3. Context Provider
- Created `src/context/family.tsx` to provide family data throughout the application
- Implemented hooks for accessing family context

### 4. Authentication
- Updated `app/(auth)/login/page.tsx` to include a family dropdown when multiple families exist
- Created `app/(auth)/[slug]/login/page.tsx` and `app/(auth)/[slug]/layout.tsx` for slug-based login

### 5. Application Routes
- Created slug-based routes for all main app pages:
  - `app/(app)/[slug]/layout.tsx`
  - `app/(app)/[slug]/log-entry/page.tsx`
  - `app/(app)/[slug]/full-log/page.tsx`
  - `app/(app)/[slug]/calendar/page.tsx`
- Updated the root page (`app/page.tsx`) to handle redirects based on family data

### 6. Middleware
- Updated `app/middleware.ts` to handle family slugs in URLs
- Added logic to redirect to the default family if only one exists
- Added logic to redirect non-slug app routes to their slug-based equivalents
- Added family information to request headers

## Current Issues

We're experiencing some issues with the implementation:

1. **Layout Nesting**: The app is experiencing layout nesting issues where both the original layout and the slug-based layout are being applied simultaneously.
2. **Infinite Loop**: The application is getting into an infinite loop of API calls.
3. **API Updates**: Some API endpoints may still need to be updated to properly handle family IDs.

## Next Steps

To resolve these issues and complete the implementation, we need to:

### 1. Fix Layout Nesting Issues
- [@app/(app)/layout.tsx](app/(app)/layout.tsx) - Modify to completely disable the original layout when using slug routes
- [@app/(app)/[slug]/layout.tsx](app/(app)/[slug]/layout.tsx) - Ensure this layout is used exclusively for slug routes

### 2. Update API Endpoints
- [@app/api/baby/route.ts](app/api/baby/route.ts) - Update to filter by family ID
- [@app/api/timeline/route.ts](app/api/timeline/route.ts) - Update to filter by family ID
- [@app/api/settings/route.ts](app/api/settings/route.ts) - Update to filter by family ID
- Update all other API endpoints to include family filtering

### 3. Update Components
- [@src/components/forms/SleepForm.tsx](src/components/forms/SleepForm.tsx) - Add familyId prop
- [@src/components/forms/FeedForm.tsx](src/components/forms/FeedForm.tsx) - Add familyId prop
- [@src/components/forms/DiaperForm.tsx](src/components/forms/DiaperForm.tsx) - Add familyId prop
- Update all other form components to include family ID

### 4. Navigation Updates
- [@src/components/ui/side-nav.tsx](src/components/ui/side-nav.tsx) - Update to include family slug in navigation paths
- Ensure all internal links include the family slug

### 5. Testing
- Test family selection on login
- Test navigation between different family pages
- Test data isolation between families
- Test API endpoints with family filtering

## Implementation Strategy

1. First, fix the layout nesting issues to prevent infinite loops
2. Update API endpoints to properly filter by family ID
3. Update components to pass family ID to API calls
4. Test thoroughly with multiple families

## Resources

- [Next.js Dynamic Routes Documentation](https://nextjs.org/docs/routing/dynamic-routes)
- [React Context API Documentation](https://reactjs.org/docs/context.html)
- [Prisma Relations Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
