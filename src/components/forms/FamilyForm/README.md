# FamilyForm Component

A comprehensive form component for system administrators to add new families to the baby tracking application. This form provides two distinct setup modes: manual family creation and setup token generation.

## Features

### Two Setup Modes

1. **Manual Setup**: Complete family configuration in one step
   - Family information (name, URL slug)
   - Security setup (system PIN or individual caretaker PINs)
   - Baby information (name, birth date, gender, warning times)
   - All data is saved immediately upon form submission

2. **Token Generation**: Create invitation links for families to complete their own setup
   - Family basic information (name, URL slug)
   - System PIN for initial access
   - Generates a secure, time-limited setup token
   - ShareButton integration for easy distribution

### Key Features

- **Real-time URL validation**: Checks slug uniqueness with debounced API calls
- **Auto-slug generation**: Creates slugs from family names or generates random ones
- **Comprehensive validation**: Form-level and API-level validation
- **ShareButton integration**: Easy sharing of setup tokens
- **Error handling**: Clear error messages and user feedback
- **Loading states**: Visual feedback during API operations
- **Dark mode support**: Consistent styling across themes

## Usage

```tsx
import FamilyForm from '@/src/components/forms/FamilyForm';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleFamilyChange = () => {
    // Refresh families list or update state
    console.log('Family added/updated');
  };
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Add New Family
      </Button>
      
      <FamilyForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isEditing={false}
        family={null}
        onFamilyChange={handleFamilyChange}
      />
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | Required | Whether the form is open |
| `onClose` | `() => void` | Required | Function to call when closing the form |
| `isEditing` | `boolean` | Required | Whether editing existing family (currently only supports new families) |
| `family` | `FamilyData \| null` | Required | Family data for editing (null for new families) |
| `onFamilyChange` | `() => void` | Required | Function to call when families need to be refreshed |

## Implementation Details

### Setup Mode Selection

The form starts with a radio button selection allowing administrators to choose between:

```tsx
// Manual setup - complete configuration
<input
  type="radio"
  id="manual"
  checked={setupMode === 'manual'}
  onChange={() => setSetupMode('manual')}
/>

// Token generation - create invitation
<input
  type="radio"  
  id="token"
  checked={setupMode === 'token'}
  onChange={() => setSetupMode('token')}
/>
```

### Family Information Section

Both modes require basic family information:

- **Family Name**: Required text input
- **Family URL**: Auto-generated from name or manually entered
  - Real-time uniqueness validation
  - Auto-suggestion when clicking empty field
  - Manual generation button for random slugs

### Manual Mode Features

When manual setup is selected, the form expands to include:

#### Security Setup
- **System PIN option**: Single PIN for family access
- **Individual Caretakers option**: Multiple caretakers with unique login IDs and PINs
  - Validates login ID format (2 digits, not "00")
  - Prevents duplicate login IDs
  - Role assignment (Admin/User)
  - Add/remove caretakers dynamically

#### Baby Information
- **Personal details**: First name, last name, birth date, gender
- **Warning times**: Feed and diaper change warning thresholds
- **Date picker**: Calendar interface for birth date selection

### Token Mode Features

When token generation is selected:

- **System PIN**: Required for initial family access
- **Token Generation**: Creates secure setup invitation
- **ShareButton Integration**: Easy distribution of setup links
- **Token Display**: Shows generated token with expiration info

### API Integration

The form integrates with multiple API endpoints:

```tsx
// Family management
POST /api/family/create              // Create new family (manual)
POST /api/family/create-setup-link   // Generate setup token
GET  /api/family/by-slug/{slug}      // Validate slug uniqueness
GET  /api/family/generate-slug       // Generate random slug

// Manual setup APIs
PUT  /api/settings?familyId={id}     // Save security settings
POST /api/caretaker                  // Save caretakers
POST /api/baby                       // Save baby information

// Configuration
GET  /api/app-config/public          // App config for ShareButton
```

### Validation Logic

The form implements comprehensive validation:

```tsx
// Family information validation
if (!familyName.trim()) {
  setError('Please enter a family name');
  return;
}

if (!familySlug.trim()) {
  setError('Please enter a family URL');
  return;
}

if (slugError) {
  setError('Please fix the URL error before proceeding');
  return;
}

// Mode-specific validation
if (setupMode === 'token') {
  if (tokenSystemPin.length < 6 || tokenSystemPin.length > 10) {
    setError('System PIN must be between 6 and 10 digits');
    return;
  }
} else {
  // Manual mode validation for security, baby info, etc.
}
```

### Security Considerations

- **Authentication required**: All API calls include authorization headers
- **Input sanitization**: PIN inputs restricted to digits
- **Slug validation**: Prevents special characters and duplicates
- **System account protection**: Prevents use of reserved login ID "00"
- **Token security**: Generated tokens are time-limited and single-use

### Error Handling

The form provides clear error feedback:

- **Validation errors**: Real-time field validation
- **API errors**: Server-side error messages
- **Network errors**: Connection and timeout handling
- **User-friendly messages**: Clear, actionable error descriptions

### Performance Optimizations

- **Debounced validation**: Slug checking with 500ms delay
- **Conditional API calls**: App config fetched only when needed
- **Form state management**: Efficient state updates and resets
- **Loading states**: Prevents multiple submissions

## Mobile Considerations (React Native)

When adapting this component for React Native:

### UI Components
- Replace HTML form elements with React Native equivalents
- Use React Native's DateTimePicker for birth date selection
- Implement custom radio button components
- Replace HTML input types with appropriate React Native inputs

### State Management
- Core form logic can remain largely unchanged
- API integration patterns will be similar
- Validation logic is fully reusable

### Platform-Specific Features
- **Sharing**: Use React Native's Share module instead of ShareButton
- **Navigation**: Adapt to React Native navigation patterns
- **Storage**: Use AsyncStorage instead of localStorage
- **Styling**: Convert TailwindCSS to React Native StyleSheet

## Cross-Platform Compatibility

The component follows the project's cross-platform guidelines:

1. **Separation of concerns**: UI components separate from business logic
2. **Reusable validation**: Pure functions for form validation
3. **API abstraction**: Consistent API calling patterns
4. **State management**: React hooks for cross-platform state
5. **Error handling**: Platform-agnostic error management

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