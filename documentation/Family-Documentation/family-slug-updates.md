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
- Updated all API endpoints to filter data by family ID:
  - Activity logs (sleep, feed, diaper, bath, pump, etc.)
  - Baby information and activities
  - Timeline and activity summaries
  - Settings and configuration
  - Medicine and contacts

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

We're still experiencing some issues with the implementation:

1. **Layout Nesting**: The app is experiencing layout nesting issues where both the original layout and the slug-based layout are being applied simultaneously.
2. **Infinite Loop**: Despite updating all API endpoints to filter by family ID, we're still experiencing infinite loops of API calls. This suggests there might be issues with the layout structure or component rendering.

## Next Steps

To resolve these issues and complete the implementation, we need to:

### 1. Fix Layout Nesting Issues
- [@app/(app)/layout.tsx](app/(app)/layout.tsx) - Modify to completely disable the original layout when using slug routes
- [@app/(app)/[slug]/layout.tsx](app/(app)/[slug]/layout.tsx) - Ensure this layout is used exclusively for slug routes

### 2. Update API Endpoints
- ✅ [@app/api/baby/route.ts](app/api/baby/route.ts) - Updated to filter by family ID
- ✅ [@app/api/timeline/route.ts](app/api/timeline/route.ts) - Updated to filter by family ID
- ✅ [@app/api/settings/route.ts](app/api/settings/route.ts) - Updated to filter by family ID
- ✅ Updated all other API endpoints to include family filtering:
  - `/app/api/activity-settings/route.ts`
  - `/app/api/bath-log/route.ts`
  - `/app/api/medicine-log/route.ts`
  - `/app/api/sleep-log/route.ts`
  - `/app/api/mood-log/route.ts`
  - `/app/api/feed-log/route.ts`
  - `/app/api/note/route.ts`
  - `/app/api/baby-last-activities/route.ts`
  - `/app/api/contact/route.ts`
  - `/app/api/measurement-log/route.ts`
  - `/app/api/pump-log/route.ts`
  - `/app/api/baby-upcoming-events/route.ts`
  - `/app/api/medicine/route.ts`

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
   - This appears to be the most critical issue now that API endpoints have been updated
   - Focus on ensuring that only one layout is applied at a time
2. ✅ Update API endpoints to properly filter by family ID (completed)
3. Update components to pass family ID to API calls
4. Test thoroughly with multiple families

## Debugging the Infinite Loop Issue

Since we've updated all API endpoints to filter by family ID but are still experiencing infinite loops, we should focus on:

1. **Layout Structure**: Examine how layouts are nested and ensure they don't conflict
   - Check if both `app/(app)/layout.tsx` and `app/(app)/[slug]/layout.tsx` are being applied simultaneously
   - Ensure that the original layout is completely disabled when using slug routes

2. **Component Rendering**: Look for components that might be triggering unnecessary re-renders
   - Check for components that fetch data on mount and might be re-mounting repeatedly
   - Look for circular dependencies in context providers or hooks

3. **Network Requests**: Monitor network requests to identify which API calls are looping
   - Use browser developer tools to track network activity
   - Look for patterns in the repeated API calls

## Resources

- [Next.js Dynamic Routes Documentation](https://nextjs.org/docs/routing/dynamic-routes)
- [React Context API Documentation](https://reactjs.org/docs/context.html)
- [Prisma Relations Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
