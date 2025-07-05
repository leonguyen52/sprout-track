# PumpForm Component

A form component for recording and editing breast pumping activities in the Baby Tracker application.

## Features

- Records start and end times for pumping sessions
- Tracks left and right breast amounts separately with intuitive increment/decrement controls
- Automatically calculates total amount based on left and right amounts
- Supports different measurement units (oz, ml) with easy toggle buttons
- Allows adding notes for each session
- Handles both creation and editing of pump records
- Follows the application's form design pattern
- Supports dark mode with appropriate styling
- Multi-family support with family ID association

## Usage

```tsx
import PumpForm from '@/src/components/forms/PumpForm';
import { useFamily } from '@/src/context/family'; // Import family context
import { useState } from 'react';

function ParentComponent() {
  const [showPumpForm, setShowPumpForm] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState({ id: 'baby-id' });
  const { family } = useFamily(); // Get current family from context
  
  return (
    <>
      <button onClick={() => setShowPumpForm(true)}>
        Record Pumping Session
      </button>
      
      <PumpForm
        isOpen={showPumpForm}
        onClose={() => setShowPumpForm(false)}
        babyId={selectedBaby?.id}
        initialTime={new Date().toISOString()}
        familyId={family?.id} // Pass the current family ID
        onSuccess={() => {
          // Refresh data or show success message
        }}
      />
    </>
  );
}
```

## Component API

### PumpForm

Main component for recording breast pumping activities.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `isOpen` | `boolean` | Controls whether the form is visible | Required |
| `onClose` | `() => void` | Function to call when the form should be closed | Required |
| `babyId` | `string \| undefined` | ID of the baby for whom the activity is being recorded | Required |
| `initialTime` | `string` | Initial time value for the form (ISO format) | Required |
| `activity` | `PumpLogResponse` | Existing activity data (for edit mode) | `undefined` |
| `onSuccess` | `() => void` | Optional callback function called after successful submission | `undefined` |
| `familyId` | `string` | The ID of the family this pump record belongs to (for multi-family support) | `undefined` |

## Form Fields

The form includes the following fields:

1. **Start Time**: When the pumping session began (required)
2. **End Time**: When the pumping session ended (optional)
3. **Left Amount**: Amount pumped from left breast with increment/decrement buttons (optional)
4. **Right Amount**: Amount pumped from right breast with increment/decrement buttons (optional)
5. **Total Amount**: Total amount pumped (calculated automatically)
6. **Unit**: Measurement unit (oz or ml) with toggle buttons
7. **Notes**: Additional notes about the session (optional)

## Behavior

- When both start and end times are provided, the duration is automatically calculated
- When left and/or right amounts are entered, the total amount is automatically calculated
- The form validates that amount fields contain valid numeric values
- The form handles both creation of new records and editing of existing ones

## Implementation Details

The component uses the following UI components from the application's component library:

- `FormPage`, `FormPageContent`, `FormPageFooter` for layout
- `DateTimePicker` for date and time selection
- `Input` for text inputs
- `Textarea` for multiline text input
- `Button` for form actions and increment/decrement controls
- `Label` for form field labels
- Lucide React icons (`Plus`, `Minus`) for increment/decrement buttons

The component follows the standard form initialization pattern to prevent form resets when the `initialTime` prop changes.

### User Experience Improvements

- Unit selection buttons positioned at the top for easy access
- Left and right amount inputs on separate rows for better clarity
- Larger input fields with increased text size for better readability
- Increment/decrement buttons for easy adjustment of amounts
- Automatic calculation of total amount as left and right amounts are changed
- Appropriate step sizes for increments (0.5 for oz, 5 for ml)
- Descriptive form title and description
- Dark mode support with custom styling

## API Integration

The form submits data to the `/api/pump-log` endpoint, using:
- POST for creating new records
- PUT with an ID parameter for updating existing records

The form includes the authentication token in the request headers for secure API access.

### Multi-Family Support

The component supports multi-family functionality by:
- Accepting a `familyId` prop to associate the pump record with a specific family
- Including the family ID in the API request payload
- The API endpoint also extracts the family ID from request headers as a fallback

When using this component in a multi-family context, you should:
1. Import and use the family context to get the current family ID
2. Pass the family ID to the PumpForm component
3. The component will handle sending this ID to the API

## Cross-Platform Considerations

This component is designed with cross-platform compatibility in mind:
- Uses standard React patterns that can be adapted to React Native
- Avoids web-specific APIs where possible
- Uses relative sizing that can be adapted to different screen sizes
- Implements touch-friendly input controls with appropriately sized buttons
- Separates styling concerns with CSS files for easier platform-specific styling
- Uses a modular approach that can be adapted to different platforms
