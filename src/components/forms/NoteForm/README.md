# NoteForm Component

A form component for creating and editing notes about a baby. This component follows the form-page pattern used throughout the application.

## Features

- Create new notes
- Edit existing notes
- Category auto-suggestion with dropdown
- Form validation for required fields
- Responsive design
- Multi-family support with family ID association

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls whether the form is visible |
| `onClose` | () => void | Yes | Function to call when the form should be closed |
| `babyId` | string \| undefined | Yes | ID of the baby for whom the note is being recorded |
| `initialTime` | string | Yes | Initial time value for the form (ISO format) |
| `activity` | NoteResponse | No | Existing note data (for edit mode) |
| `onSuccess` | () => void | No | Optional callback function called after successful submission |
| `familyId` | string | No | The ID of the family this note belongs to (for multi-family support) |

## Usage

```tsx
import NoteForm from '@/src/components/forms/NoteForm';
import { useFamily } from '@/src/context/family'; // Import family context

function MyComponent() {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<{ id: string }>();
  const { family } = useFamily(); // Get current family from context
  
  return (
    <>
      <Button onClick={() => setShowNoteForm(true)}>
        Add Note
      </Button>
      
      <NoteForm
        isOpen={showNoteForm}
        onClose={() => setShowNoteForm(false)}
        babyId={selectedBaby?.id}
        initialTime={new Date().toISOString()}
        familyId={family?.id} // Pass the current family ID
        onSuccess={() => {
          // Refresh data or perform other actions after successful submission
        }}
      />
    </>
  );
}
```

## Form Fields

The component includes the following fields:

- **Time**: Date and time of the note (required)
- **Category**: Optional category for organizing notes, with auto-suggestion dropdown
- **Note**: The content of the note (required)

## Implementation Details

- Uses the FormPage component for consistent UI across the application
- Implements useEffect hooks to populate form data when editing
- Uses an initialization flag to prevent form reset when initialTime prop changes
- Fetches existing categories from the API for auto-suggestion
- Provides an interactive dropdown for category selection with keyboard navigation
- Handles API calls for creating and updating notes
- Resets form after successful submission
- Implements proper accessibility features for keyboard navigation
- Uses refs to handle click-outside behavior for the dropdown
- Supports multi-family functionality by accepting a familyId prop and including it in API requests

### Multi-Family Support

The component supports multi-family functionality by:
- Accepting a `familyId` prop to associate the note with a specific family
- Including the family ID in the API request payload
- The API endpoint also extracts the family ID from request headers as a fallback

When using this component in a multi-family context, you should:
1. Import and use the family context to get the current family ID
2. Pass the family ID to the NoteForm component
3. The component will handle sending this ID to the API
