# MeasurementForm Component

A form component for recording and editing baby measurements such as height, weight, head circumference, and temperature.

## Features

- Record new measurements with date, type, value, unit, and optional notes
- Edit existing measurements
- Type-specific unit selection based on measurement type
- Timezone-aware date handling
- Form validation for required fields
- Loading state during API calls
- Consistent styling with other form components
- Multi-family support with family ID association

## Usage

```tsx
import MeasurementForm from '@/src/components/forms/MeasurementForm';
import { useState } from 'react';

function ParentComponent() {
  const [showForm, setShowForm] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState({ id: '123' });
  
  return (
    <>
      <button onClick={() => setShowForm(true)}>Log Measurement</button>
      
      <MeasurementForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        babyId={selectedBaby?.id}
        initialTime={new Date().toISOString()}
        onSuccess={() => {
          // Refresh data or show success message
        }}
      />
    </>
  );
}
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `isOpen` | `boolean` | Controls whether the form is visible | Required |
| `onClose` | `() => void` | Function to call when the form should be closed | Required |
| `babyId` | `string \| undefined` | ID of the baby for whom the measurement is being recorded | Required |
| `initialTime` | `string` | Initial time value for the form (ISO format) | Required |
| `activity` | `MeasurementResponse` | Existing measurement data (for edit mode) | `undefined` |
| `onSuccess` | `() => void` | Optional callback function called after successful submission | `undefined` |
| `familyId` | `string` | The ID of the family this measurement belongs to (for multi-family support) | `undefined` |

## Measurement Types

The form supports the following measurement types:

- **Height**: Recorded in inches (in) or centimeters (cm)
- **Weight**: Recorded in pounds (lb), kilograms (kg), or ounces (oz)
- **Head Circumference**: Recorded in inches (in) or centimeters (cm)
- **Temperature**: Recorded in Fahrenheit (°F) or Celsius (°C)

## Form Fields

1. **Date & Time**: When the measurement was taken
2. **Measurement Type**: Type of measurement (height, weight, head circumference, temperature)
3. **Value**: Numeric value of the measurement
4. **Unit**: Unit of measurement (depends on the selected measurement type)
5. **Notes**: Optional additional information about the measurement

## Implementation Details

The component follows the standard form pattern used throughout the application:

- Uses the `FormPage` component for layout and structure
- Implements the initialization flag pattern to prevent form resets
- Handles timezone conversion for proper date storage
- Provides appropriate validation for all required fields
- Resets form state after submission
- Shows loading state during API calls

## API Integration

The form submits data to the `/api/measurement-log` endpoint:

- **POST**: For creating new measurements
- **PUT**: For updating existing measurements (with `?id=<measurement_id>` query parameter)

The payload structure follows the `MeasurementCreate` interface defined in the API types.
