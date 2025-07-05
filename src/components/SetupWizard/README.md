# SetupWizard Component

A multi-stage wizard component that guides users through the initial setup process for the Sprout Track application.

## Setup Scenarios

The SetupWizard supports three distinct setup scenarios through the `/api/setup/start` endpoint:

### 1. Brand New Setup (System Password)
- **When**: Initial system setup with no existing families
- **Authentication**: System admin credentials
- **Usage**: `SetupWizard` without a token
- **API Call**: `POST /api/setup/start` with `{ name, slug }` (no token, no isNewFamily flag)
- **Behavior**: Updates the existing default family or creates a new one if none exists

### 2. System Admin Creating New Families
- **When**: System admin wants to create additional families
- **Authentication**: System admin credentials
- **Usage**: `FamilyForm` in manual setup mode
- **API Call**: `POST /api/setup/start` with `{ name, slug, isNewFamily: true }`
- **Behavior**: Always creates a new family (doesn't update existing ones)

### 3. Token-Based Family Creation
- **When**: Family uses an invitation token to create their own family
- **Authentication**: Token-based credentials
- **Usage**: `SetupWizard` with a token
- **API Call**: `POST /api/setup/start` with `{ name, slug, token }`
- **Behavior**: Creates a new family and marks the invitation token as used

## Features

- Three-stage setup process:
  - **Family Setup**: Collects the family name and URL slug
  - **Security Setup**: Configures security options (system-wide PIN or individual caretaker PINs)
  - **Baby Setup**: Collects information about the baby (name, birth date, gender, warning times)
- Progress indicator showing current stage
- Form validation for each stage
- Error handling for API requests
- Responsive design for mobile and desktop
- Dark mode support
- Token-based authentication support

## Usage

### Basic Setup (Scenario 1)
```tsx
import { SetupWizard } from "@/src/components/SetupWizard";

export function InitialSetup() {
  const handleSetupComplete = (family) => {
    // Handle setup completion, e.g., redirect to family dashboard
    console.log('Setup complete for family:', family);
  };

  return (
    <SetupWizard onComplete={handleSetupComplete} />
  );
}
```

### Token-Based Setup (Scenario 3)
```tsx
import { SetupWizard } from "@/src/components/SetupWizard";

export function TokenSetup({ token }) {
  const handleSetupComplete = (family) => {
    // Handle setup completion, redirect to family dashboard
    console.log('Token setup complete for family:', family);
  };

  return (
    <SetupWizard 
      onComplete={handleSetupComplete} 
      token={token} // Token from URL or invitation
    />
  );
}
```

## Implementation Details

The SetupWizard component is built using:

- React functional components with TypeScript
- React hooks for state management
- TailwindCSS for styling via utility functions
- Shadcn UI components for form elements
- Lucide React for icons
- Date-fns for date formatting

The component follows a modular structure:
- `index.tsx` - Main component implementation
- `FamilySetupStage.tsx` - Family setup stage implementation
- `SecuritySetupStage.tsx` - Security setup stage implementation
- `BabySetupStage.tsx` - Baby setup stage implementation
- `setup-wizard.styles.ts` - Style definitions using TailwindCSS
- `setup-wizard.css` - Dark mode style overrides
- `setup-wizard.types.ts` - TypeScript type definitions
- `README.md` - Documentation

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onComplete` | `(family: { id: string; name: string; slug: string }) => void` | Function to call when the setup is complete |
| `token` | `string` (optional) | Setup invitation token for token-based family creation |

## API Dependencies

The component relies on several API endpoints:

- `/api/setup/start` - Primary family creation endpoint (handles all scenarios)
- `/api/settings` - For updating family settings and security PIN
- `/api/caretaker` - For saving caretaker information
- `/api/baby` - For saving baby information

## Authentication

The component handles authentication automatically:

- **System Admin**: Uses JWT token with `isSysAdmin: true`
- **Token-based**: Uses JWT token with `isSetupAuth: true` and `setupToken`
- **Authentication headers**: Added automatically via `getAuthHeaders()`

## Workflow

1. **Stage 1: Family Setup**
   - User enters the family name and URL slug
   - Real-time slug validation and uniqueness checking
   - Auto-generation of slugs from family names
   - Calls `/api/setup/start` to create family and initial settings

2. **Stage 2: Security Setup**
   - User chooses between system-wide PIN or individual caretaker PINs
   - For system-wide PIN:
     - User enters and confirms a PIN (6-10 digits)
     - Updates family settings and system caretaker
   - For individual caretaker PINs:
     - User adds one or more caretakers with login IDs, names, roles, and PINs
     - Validates login ID format and uniqueness
     - Creates caretaker records in the database

3. **Stage 3: Baby Setup**
   - User enters baby's personal information
   - User sets warning times for feeding and diaper changes
   - Validates all required fields
   - Saves baby information to the database

4. **Completion**
   - Clears authentication tokens to force re-login
   - Calls the `onComplete` callback with family data

## Error Handling

The component provides comprehensive error handling:

- **Form validation**: Client-side validation for all fields
- **API errors**: Server-side error messages displayed to users
- **Network errors**: Connection and timeout handling
- **Authentication errors**: Invalid or expired tokens
- **User-friendly messages**: Clear, actionable error descriptions

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
- **Navigation**: Adapt to React Native navigation patterns
- **Storage**: Use AsyncStorage instead of localStorage
- **Styling**: Convert TailwindCSS to React Native StyleSheet
- **Authentication**: Adapt JWT token handling for React Native

## Cross-Platform Compatibility

The component follows the project's cross-platform guidelines:

1. **Separation of concerns**: UI components separate from business logic
2. **Reusable validation**: Pure functions for form validation
3. **API abstraction**: Consistent API calling patterns
4. **State management**: React hooks for cross-platform state
5. **Error handling**: Platform-agnostic error management
