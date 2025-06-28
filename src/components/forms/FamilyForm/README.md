# FamilyForm Component

A form component for creating and editing family profiles in the Baby Tracker application. This component provides a user-friendly interface for managing family information with real-time slug validation.

## Features

- Create new family profiles
- Edit existing family profiles
- Auto-generate URL-friendly slugs from family names
- Real-time slug uniqueness validation with debouncing
- Visual feedback for validation states (loading spinner, error messages)
- Form validation for required fields
- Responsive design for mobile and desktop
- Loading state handling during form submission
- Multi-family support architecture

## Usage

```tsx
import FamilyForm from '@/src/components/forms/FamilyForm';
import { useState } from 'react';

function FamilyManagement() {
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // To open the form for creating a new family
  const handleAddFamily = () => {
    setSelectedFamily(null);
    setIsEditing(false);
    setShowFamilyForm(true);
  };

  // To open the form for editing an existing family
  const handleEditFamily = (family) => {
    setSelectedFamily(family);
    setIsEditing(true);
    setShowFamilyForm(true);
  };

  // Handle form submission success
  const handleFamilyChange = () => {
    // Refresh family data or perform other actions
    fetchFamilies();
  };

  return (
    <>
      <button onClick={handleAddFamily}>Add New Family</button>
      
      <FamilyForm
        isOpen={showFamilyForm}
        onClose={() => setShowFamilyForm(false)}
        isEditing={isEditing}
        family={selectedFamily}
        onFamilyChange={handleFamilyChange}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls the visibility of the form |
| `onClose` | () => void | Yes | Function called when the form is closed |
| `isEditing` | boolean | Yes | Determines if the form is in edit mode or create mode |
| `family` | Family \| null | Yes | The family object to edit (null when creating a new family) |
| `onFamilyChange` | () => void | No | Callback function called after a family is successfully created or updated |

## Family Interface

The component expects a Family object with the following structure:

```typescript
interface Family {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Form Fields

The component includes the following fields:

### Family Name (Required)
- Text input for the family's display name
- Auto-generates the slug as the user types (for new families)
- Required field with validation

### Family Slug (Required)
- URL-friendly identifier used in routing
- Auto-generated from family name for new families
- Editable for both new and existing families
- Real-time uniqueness validation with visual feedback
- Shows preview of how it will appear in URLs
- Displays validation errors if slug is already taken

### Active Status (Edit Mode Only)
- Checkbox to control whether the family is active
- Only shown when editing existing families
- New families are created as active by default

## Validation Features

### Real-time Slug Validation
- Debounced API calls (500ms delay) to check slug uniqueness
- Visual loading spinner during validation
- Error message display when slug is taken
- Excludes current family from uniqueness check during editing
- Graceful error handling for API failures

### Form Validation
- Required field validation for name and slug
- Prevents submission when validation errors exist
- User-friendly error messages

### Auto-slug Generation
- Converts family name to URL-friendly format
- Removes special characters and converts to lowercase
- Replaces spaces with hyphens
- Removes leading/trailing hyphens
- Handles multiple consecutive hyphens

## API Integration

The component integrates with the following API endpoints:

### Family Management API (`/api/family/manage`)
- **POST**: Create new family
- **PUT**: Update existing family

### Slug Validation API (`/api/family/by-slug/[slug]`)
- **GET**: Check if slug exists
- Returns 404 if slug is available
- Returns family data if slug exists

## Implementation Details

- Uses the FormPage component for consistent UI across the application
- Implements multiple useEffect hooks for form lifecycle management
- Provides visual feedback during all async operations
- Handles form reset and cleanup properly
- Uses controlled components for all form inputs
- Implements proper error handling and user feedback

## Styling

The component uses:
- FormPage component for layout and animations
- Tailwind CSS classes for styling
- Consistent with the application's design system
- Form-specific styling with `.form-label` class for labels
- Visual indicators for validation states (red borders, error text)
- Loading states with spinners and disabled states

## Accessibility

- Proper form labels associated with inputs
- Required field indicators with asterisks
- Descriptive helper text for form fields
- Error messages with semantic markup
- Keyboard navigation support
- Focus management when form opens and closes
- Disabled state handling for all interactive elements

## Cross-Platform Considerations

When adapting this component for React Native:

- Replace HTML form elements with React Native equivalents
- Convert FormPage to React Native Modal
- Replace Tailwind classes with React Native StyleSheet
- Adapt validation styling for React Native components
- Use React Native's TextInput for form fields
- Handle keyboard behavior appropriately for mobile

The component follows the project's cross-platform compatibility guidelines by:
1. Separating business logic from UI components
2. Using modular component structure
3. Implementing proper state management patterns
4. Providing comprehensive documentation for adaptation 