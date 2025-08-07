# FeedbackForm Component

A form component for collecting user feedback and support requests. This component follows the form-page pattern used throughout the application and automatically captures user context information.

## Features

- Collects feedback with subject and message
- Automatically captures submitter information (name, email, family context)
- Form validation for required fields
- Responsive design with dark mode support
- Multi-family support with family ID association
- Success/error handling with user feedback

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls whether the form is visible |
| `onClose` | () => void | Yes | Function to call when the form should be closed |
| `onSuccess` | () => void | No | Optional callback function called after successful submission |

## Usage

```tsx
import FeedbackForm from '@/src/components/forms/FeedbackForm';

function MyComponent() {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowFeedbackForm(true)}>
        Send Feedback
      </Button>
      
      <FeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        onSuccess={() => {
          // Optional: Handle successful feedback submission
          console.log('Feedback submitted successfully');
        }}
      />
    </>
  );
}
```

## Form Fields

The component includes the following fields:

- **Subject**: Brief description of the feedback (required)
- **Message**: Detailed feedback, suggestions, or issue report (required)

## Automatic Context Capture

The component automatically captures and displays:

- **Submitter Name**: Extracted from authentication token (account email prefix or caretaker name)
- **Submitter Email**: Account email if available (account users only)
- **Family Context**: Current family name and ID from family context

## Implementation Details

- Uses the FormPage component for consistent UI across the application
- Automatically extracts user information from JWT authentication token
- Supports both account-based and caretaker-based authentication
- Includes form validation for required fields
- Handles API calls for submitting feedback
- Provides user feedback through alerts for success/error states
- Resets form after successful submission
- Uses emerald/green theme colors to indicate positive action (feedback submission)

### Authentication Context

The component handles different authentication scenarios:

1. **Account Authentication**: Extracts email and uses email prefix as name
2. **Caretaker Authentication**: Extracts caretaker name from token
3. **No Authentication**: Falls back to generic "User" name

### Multi-Family Support

The component supports multi-family functionality by:
- Automatically using the current family context from `useFamily()` hook
- Including the family ID in the API request payload
- Displaying the current family name in the submitter information

### API Integration

The component sends feedback data to `/api/feedback` with the following payload:
```json
{
  "subject": "string",
  "message": "string", 
  "familyId": "string|null",
  "submitterName": "string",
  "submitterEmail": "string|null"
}
```

## Styling

The component uses:
- Light mode styles defined in the component and CSS classes
- Dark mode overrides in `feedback-form.css`
- Consistent styling with other form components
- Emerald/green accent colors for the submit button
- Info box styling for displaying submitter context

## Accessibility

- Proper form labels and required field indicators
- Keyboard navigation support
- Screen reader friendly structure
- Clear error and success messaging
- Disabled states during form submission

## Error Handling

The component handles various error scenarios:
- Network errors during submission
- API validation errors
- Authentication token parsing errors
- Missing required fields

All errors are displayed to the user through alert dialogs with descriptive messages.
