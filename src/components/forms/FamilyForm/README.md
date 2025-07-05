# FamilyForm Component

A comprehensive form component for creating new families with setup options, security configurations, and baby information.

## Important: API Usage Distinction

The FamilyForm component is specifically designed for **creating new families**. The family-manager uses different APIs for different purposes:

- **Creating new families**: `FamilyForm` component → `POST /api/setup/start`
- **Editing existing families**: Family-manager inline editing → `PUT /api/family/manage`
- **Fetching families**: Family-manager → `GET /api/family/manage`

This separation ensures that:
- New families get both family records AND initial settings
- Existing families can be updated without affecting their settings
- The setup process is properly handled for new families

## Features

- **Family Information**: Name, URL slug with real-time validation
- **Setup Options**: Choose between invitation tokens or manual setup
- **Security Configuration**: System-wide PIN or individual caretaker management
- **Baby Information**: Complete baby profile with warning time settings
- **Validation**: Comprehensive client-side and server-side validation
- **Error handling**: User-friendly error messages and loading states
- **Responsive Design**: Works on mobile and desktop devices
- **Dark Mode**: Full dark mode support

## Setup Flow Options

### Option 1: Generate Invitation Token
1. User fills out family information
2. System generates a secure invitation token
3. Token is shared with the family
4. Family uses token to complete their own setup

### Option 2: Manual Setup
1. User fills out family information
2. User configures security settings (PIN or caretakers)
3. User adds baby information
4. System creates complete family setup immediately

## Usage

### Basic Usage
```tsx
import FamilyForm from "@/src/components/forms/FamilyForm";

export function MyComponent() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFamilyChange = () => {
    // Handle family creation success
    // e.g., refresh family list, show success message
    console.log('Family created successfully');
  };

  return (
    <div>
      <button onClick={() => setIsFormOpen(true)}>
        Add New Family
      </button>
      
      <FamilyForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onFamilyChange={handleFamilyChange}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Whether the form modal is open |
| `onClose` | `() => void` | Function to call when closing the form |
| `onFamilyChange` | `() => void` | Function to call when a family is created/updated |
| `isEditing` | `boolean` (optional) | Whether the form is in edit mode (not currently used) |
| `family` | `FamilyData` (optional) | Family data for editing (not currently used) |

## API Integration

The form integrates with multiple API endpoints:

```tsx
// Family management
POST /api/setup/start                // Create new family with initial settings (manual)
POST /api/family/create-setup-link   // Generate setup token
GET  /api/family/by-slug/{slug}      // Validate slug uniqueness
GET  /api/family/generate-slug       // Generate random slug

// Manual setup APIs
PUT  /api/settings?familyId={id}     // Save security settings
POST /api/caretaker                  // Save caretakers
POST /api/baby/create                // Save baby information

// Configuration
GET  /api/app-config/public          // App config for ShareButton
```

## Component Structure

The component is organized into logical sections:

- **Family Information**: Name and URL slug configuration
- **Setup Options**: Toggle between invitation and manual setup
- **Security Settings**: PIN or caretaker configuration (manual setup only)
- **Baby Information**: Baby profile setup (manual setup only)
- **Form Controls**: Navigation and submission buttons

## Validation

### Client-Side Validation
- Required field validation
- URL slug format validation (lowercase, numbers, hyphens only)
- PIN length validation (6-10 digits)
- Login ID format validation (2 digits, not "00")
- Email format validation (if applicable)

### Server-Side Validation
- Slug uniqueness checking
- Authentication verification
- Database constraint validation
- Business rule validation

## State Management

The component uses React hooks for state management:

- `useState` for form data and UI state
- `useEffect` for side effects (API calls, validation)
- `useCallback` for memoized functions
- `useMemo` for computed values

## Error Handling

Comprehensive error handling includes:

- **Form validation errors**: Real-time field validation
- **API errors**: Server-side error messages
- **Network errors**: Connection failure handling
- **Loading states**: Visual feedback during API calls
- **User feedback**: Toast notifications and error messages

## Mobile Considerations (React Native)

When adapting this component for React Native:

### UI Components
- Replace modal with React Native modal or navigation
- Use React Native form components (TextInput, Picker, etc.)
- Implement custom toggle and checkbox components
- Use React Native DateTimePicker for date selection

### State Management
- Form logic can remain largely unchanged
- API integration patterns are similar
- Validation logic is fully reusable
- Error handling patterns are transferable

### Platform-Specific Features
- **Navigation**: Use React Native navigation patterns
- **Storage**: Use AsyncStorage for form state persistence
- **Styling**: Convert to React Native StyleSheet
- **Accessibility**: Implement React Native accessibility features

## Performance Considerations

- **Debounced validation**: Slug uniqueness checks are debounced to reduce API calls
- **Memoization**: Expensive computations are memoized
- **Lazy loading**: API calls are made only when needed
- **Error boundaries**: Graceful error handling prevents crashes

## Security Considerations

- **Input sanitization**: All user input is validated and sanitized
- **Authentication**: All API calls include authentication headers
- **HTTPS**: All communications use secure protocols
- **Token security**: Setup tokens have expiration times and are single-use

## Testing

The component should be tested for:

- **Form validation**: All validation rules work correctly
- **API integration**: Successful and error scenarios
- **User interactions**: Button clicks, form submissions
- **State management**: Proper state updates and side effects
- **Error handling**: Graceful error recovery
- **Accessibility**: Screen reader compatibility and keyboard navigation

## Cross-Platform Compatibility

The component follows cross-platform development principles:

1. **Separation of concerns**: Business logic separate from UI
2. **Reusable validation**: Pure functions for validation logic
3. **API abstraction**: Consistent API calling patterns
4. **Error handling**: Platform-agnostic error management
5. **State management**: React hooks for cross-platform compatibility

## Dependencies

- **UI Components**: FormPage, Input, Button, Select, Calendar, ShareButton
- **Date handling**: date-fns for formatting
- **Validation**: Custom validation functions
- **API**: Fetch-based HTTP client
- **Types**: TypeScript for type safety

## Future Enhancements

Potential improvements for future versions:

- **Family editing**: Extend form to support editing existing families
- **Bulk operations**: Support for creating multiple families
- **Template system**: Pre-configured family templates
- **Advanced validation**: Email validation for invitations
- **Audit logging**: Track family creation and modifications
- **Import/Export**: CSV import for bulk family creation 