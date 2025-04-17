# TimeInput Component

A specialized input component for time values in HH:MM format with built-in validation, formatting, and visual feedback.

## Features

- Automatic formatting to HH:MM pattern as the user types
- Real-time validation against proper time format (00:00 to 23:59)
- Visual feedback with color-coded borders and icons
- Error message display for invalid inputs
- Dark mode support
- Fully accessible

## Usage

```tsx
import { TimeInput } from "@/src/components/ui/time-input";

export function TimeInputExample() {
  return (
    <div className="space-y-4">
      <TimeInput 
        placeholder="Enter time (HH:MM)" 
        errorMessage="Please enter a valid time in HH:MM format"
      />
      
      <TimeInput 
        defaultValue="08:30"
        required
      />
      
      <TimeInput 
        value="14:00"
        onChange={(e) => console.log(e.target.value)}
        disabled
      />
      
      <TimeInput 
        showValidation={false}
        placeholder="No validation feedback"
      />
    </div>
  );
}
```

## Props

The TimeInput component extends most native HTML input attributes and adds:

- `errorMessage?: string` - Custom error message to display when the input is invalid
- `showValidation?: boolean` - Whether to show validation state (default: true)
- All standard input props like `value`, `onChange`, `onBlur`, `disabled`, etc.

## Validation

The component validates time entries against the following rules:

- Must be in HH:MM format
- Hours must be between 00-23
- Minutes must be between 00-59
- Empty values are considered valid (for optional fields)

## Formatting

As the user types, the input automatically formats the value:

- Digits are automatically separated with a colon after the first two digits
- Non-digit characters are filtered out
- Maximum length is enforced (5 characters including the colon)

## Visual States

The component provides visual feedback based on the input's validity:

### Valid State
- Green border
- Check icon
- No error message

### Invalid State
- Red border
- Alert icon
- Error message (if provided)

### Disabled State
- Reduced opacity
- Not-allowed cursor

## Accessibility

The component follows accessibility best practices:

- Proper focus states
- Keyboard navigation support
- Screen reader friendly error messages
- ARIA attributes for validation states
- Clear visual feedback

## Integration with Forms

The TimeInput component works seamlessly with:

- React Hook Form
- Formik
- Native HTML forms
- Custom form implementations

## Examples

### Basic Time Input
```tsx
<TimeInput placeholder="Enter time" />
```

### With Default Value
```tsx
<TimeInput defaultValue="09:30" />
```

### With Error Message
```tsx
<TimeInput 
  errorMessage="Please enter a valid time in HH:MM format" 
/>
```

### Required Time Input
```tsx
<TimeInput 
  required
  errorMessage="Time is required in HH:MM format"
/>
```

### Without Validation Display
```tsx
<TimeInput 
  showValidation={false}
  placeholder="No validation indicators"
/>
```

### With Change Handler
```tsx
<TimeInput 
  onChange={(e) => {
    console.log("Time changed:", e.target.value);
  }}
/>
```

### Disabled State
```tsx
<TimeInput 
  value="12:00"
  disabled
/>
