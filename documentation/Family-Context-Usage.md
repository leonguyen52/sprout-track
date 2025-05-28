# Family Context Usage in Forms and API Routes

This document explains how the family context system works in the baby tracker application, specifically focusing on form usage and data retrieval.

## Overview

The application supports multi-family functionality where each family has its own data isolation. The family information is determined by the URL slug (e.g., `/smith-family/log-entry`) and is managed through both client-side context and server-side utilities.

## Client-Side Family Context

### Family Provider (`src/context/family.tsx`)

The `FamilyProvider` component provides family information throughout the application:

```typescript
const { family, loading, error } = useFamily();
// family contains: { id: string, name: string, slug: string }
```

**Key Features:**
- Automatically extracts family slug from URL pathname
- Fetches family data from `/api/family/by-slug/{slug}`
- Persists selected family in localStorage
- Provides loading and error states

**Usage in Components:**
```typescript
import { useFamily } from '@/src/context/family';

function MyComponent() {
  const { family } = useFamily();
  
  // Use family.id in API calls
  const familyId = family?.id;
}
```

## Server-Side Family Utilities

### Family Utility Functions (`app/api/utils/family.ts`)

The server-side utilities provide multiple ways to extract family information from requests:

#### `getFamilyIdFromRequest(req, requestBody?)`
- **Priority Order:**
  1. Query parameter: `?familyId=xxx`
  2. Request body: `{ familyId: "xxx" }`
  3. URL slug lookup: `/family-slug/...` → database lookup

#### `getFamilySlugFromRequest(req)`
- Extracts family slug from URL path
- Returns first path segment (excluding `/api` routes)

#### `getFamilyFromRequest(req, requestBody?)`
- Returns complete family object: `{ id, name, slug }`
- Uses same priority as `getFamilyIdFromRequest`

## Form Implementation Pattern

### Recommended Form Structure

```typescript
import { useFamily } from '@/src/context/family';

interface MyFormProps {
  // ... other props
  familyId?: string; // Optional prop for explicit family ID
}

export default function MyForm({ familyId, ...otherProps }: MyFormProps) {
  const { family } = useFamily();
  
  const handleSubmit = async (formData) => {
    const payload = {
      ...formData,
      // Use prop familyId, fallback to context family ID
      familyId: familyId || family?.id || undefined,
    };
    
    const response = await fetch('/api/my-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };
}
```

### Example: BathForm Implementation

The `BathForm` component demonstrates proper family context usage:

```typescript
// Import family context
import { useFamily } from '@/src/context/family';

export default function BathForm({ familyId, ...props }) {
  const { family } = useFamily();
  
  const handleSubmit = async (e) => {
    const payload = {
      babyId,
      time: utcTimeString,
      soapUsed: formData.soapUsed,
      shampooUsed: formData.shampooUsed,
      notes: formData.notes || null,
      // Proper family ID resolution
      familyId: familyId || family?.id || undefined,
    };
    
    // Send to API
    await fetch('/api/bath-log', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  };
}
```

## API Route Implementation Pattern

### Recommended API Route Structure

```typescript
import { getFamilyIdFromRequest } from '../utils/family';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body = await req.json();
    
    // Get family ID from request (body, query params, or URL slug)
    const familyId = await getFamilyIdFromRequest(req, body);
    
    const result = await prisma.myTable.create({
      data: {
        ...body,
        // Include family ID if available
        ...(familyId && { familyId }),
      },
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Error handling
  }
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    // Get family ID from request (query params or URL slug)
    const familyId = await getFamilyIdFromRequest(req);
    
    const results = await prisma.myTable.findMany({
      where: {
        // Other filters...
        // Filter by family ID if available
        ...(familyId && { familyId }),
      },
    });
    
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    // Error handling
  }
}
```

### Example: Bath Log API Implementation

```typescript
// POST handler
async function handlePost(req: NextRequest, authContext: AuthResult) {
  const body: BathLogCreate = await req.json();
  
  // Get family ID from request (body, query params, or URL slug)
  const familyId = await getFamilyIdFromRequest(req, body);
  
  const bathLog = await prisma.bathLog.create({
    data: {
      ...body,
      caretakerId: authContext.caretakerId,
      ...(familyId && { familyId }), // Include family ID if available
    },
  });
}

// GET handler
async function handleGet(req: NextRequest, authContext: AuthResult) {
  // Get family ID from request (query params or URL slug)
  const familyId = await getFamilyIdFromRequest(req);
  
  const bathLogs = await prisma.bathLog.findMany({
    where: {
      babyId,
      ...(familyId && { familyId }), // Filter by family ID if available
    },
  });
}
```

## Data Isolation Strategy

### Family ID Filtering Rules

1. **Always include family ID in CREATE operations** when available
2. **Always filter by family ID in READ operations** when available
3. **Allow null/empty family ID** for backward compatibility
4. **Never show data from other families** when family ID is present

### Database Query Patterns

```typescript
// CREATE - Include family ID
const result = await prisma.table.create({
  data: {
    ...data,
    ...(familyId && { familyId }), // Only include if familyId exists
  },
});

// READ - Filter by family ID
const results = await prisma.table.findMany({
  where: {
    // Other filters...
    ...(familyId && { familyId }), // Only filter if familyId exists
  },
});

// UPDATE - Ensure family ID matches
const result = await prisma.table.update({
  where: {
    id: recordId,
    ...(familyId && { familyId }), // Ensure record belongs to family
  },
  data: updateData,
});
```

## Migration and Backward Compatibility

### Handling Existing Data

- Records without `familyId` are still accessible
- New records automatically get `familyId` when available
- Family filtering only applies when `familyId` is present
- No data loss during migration

### URL Structure

- **With Family:** `/family-slug/log-entry`
- **Without Family:** `/log-entry` (redirects to family selection or single family)

## Best Practices

### For Forms
1. Always import and use `useFamily()` hook
2. Provide `familyId` prop for flexibility
3. Use fallback pattern: `familyId || family?.id || undefined`
4. Include family ID in all API payloads

### For API Routes
1. Always use `getFamilyIdFromRequest()` for family ID extraction
2. Include family ID in database operations when available
3. Use conditional filtering: `...(familyId && { familyId })`
4. Handle both family and non-family scenarios

### For Components
1. Wrap app sections with `FamilyProvider`
2. Use family context for navigation and display
3. Pass family information to child components as needed
4. Handle loading and error states from family context

## Troubleshooting

### Common Issues

1. **Form not saving family ID:**
   - Check if `useFamily()` is imported and used
   - Verify family context is available in component tree
   - Ensure API route uses `getFamilyIdFromRequest()`

2. **Data showing from other families:**
   - Verify API route filters by family ID
   - Check if family ID is being passed correctly
   - Ensure database queries include family filter

3. **Family context not loading:**
   - Check if URL contains valid family slug
   - Verify family exists in database
   - Check network requests to family API endpoints

### Debugging Tips

1. **Client-side:** Use React DevTools to inspect family context
2. **Server-side:** Add console logs for family ID extraction
3. **Database:** Check if records have correct family ID values
4. **Network:** Monitor API requests for family ID inclusion
