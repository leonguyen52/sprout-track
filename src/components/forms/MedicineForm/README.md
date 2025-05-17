# MedicineForm Component

A comprehensive form component for managing and administering medicines in the Baby Tracker application. This component follows the form-page pattern used throughout the application and provides a tabbed interface for different medicine-related functions.

## Features

- **Active Doses Tab**: View active medicine doses with countdown timers for next safe dose
- **Give Medicine Tab**: Record medicine administration with dose amount and time
- **Manage Medicines Tab**: Add, edit, and manage medicines and their properties
- **Multi-family support**: Associate medicines with specific families
- **Contact association**: Link medicines with healthcare provider contacts
- **Responsive design**: Works on mobile and desktop devices

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls whether the form is visible |
| `onClose` | () => void | Yes | Function to call when the form should be closed |
| `babyId` | string \| undefined | Yes | ID of the baby for whom medicine is being administered |
| `initialTime` | string | Yes | Initial time value for the form (ISO format) |
| `onSuccess` | () => void | No | Optional callback function called after successful submission |
| `activity` | any | No | Existing medicine log data (for edit mode) |
| `familyId` | string | No | The ID of the family this medicine belongs to (for multi-family support) |

## Usage

```tsx
import MedicineForm from '@/src/components/forms/MedicineForm';
import { useFamily } from '@/src/context/family'; // Import family context

function MyComponent() {
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<{ id: string }>();
  const { family } = useFamily(); // Get current family from context
  
  return (
    <>
      <Button onClick={() => setShowMedicineForm(true)}>
        Medicine Tracker
      </Button>
      
      <MedicineForm
        isOpen={showMedicineForm}
        onClose={() => setShowMedicineForm(false)}
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

## Component Structure

The MedicineForm component is organized into several subcomponents:

- **index.tsx**: Main container component with tab navigation
- **GiveMedicineTab.tsx**: Form for recording medicine administration
- **ActiveDosesTab.tsx**: Display of active medicine doses with countdown timers
- **ManageMedicinesTab.tsx**: Interface for managing medicines
- **MedicineForm.tsx**: Form for adding/editing medicine details
- **ContactSelector.tsx**: Component for selecting and managing contacts
- **medicine-form.types.ts**: TypeScript interfaces for the component
- **medicine-form.styles.ts**: Styling for the component (light mode)
- **medicine-form.css**: Additional styling for dark mode

## Implementation Details

- Uses the FormPage component for consistent UI across the application
- Implements a tabbed interface for different medicine-related functions
- Fetches medicine data from the API
- Handles form validation and submission
- Provides feedback for loading and error states
- Supports multi-family functionality by accepting a familyId prop and including it in API requests

### Multi-Family Support

The component supports multi-family functionality by:
- Accepting a `familyId` prop to associate the medicine with a specific family
- Including the family ID in the API request payload
- The API endpoint also extracts the family ID from request headers as a fallback

When using this component in a multi-family context, you should:
1. Import and use the family context to get the current family ID
2. Pass the family ID to the MedicineForm component
3. The component will handle sending this ID to the API

## Accessibility

- Proper form labels for all input fields
- Required field validation
- Keyboard navigation support
- Focus management when the form opens and closes
- ARIA attributes for improved screen reader support

## Dark Mode Support

The component includes dark mode styling in the `medicine-form.css` file, which is automatically applied when the application is in dark mode.
