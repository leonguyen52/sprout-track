# Form Components

This directory contains form implementations that use the FormPage component.

## SettingsForm

The SettingsForm component is a full-screen form that allows users to configure application settings. It includes:

- Family name configuration
- Security PIN management
- Database backup and restore functionality
- Baby management (add, edit, select)

### Usage

```tsx
import SettingsForm from '@/src/components/forms/SettingsForm';
import { useFamily } from '@/src/context/family'; // Import family context

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const { family } = useFamily(); // Get current family from context
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Settings
      </Button>
      
      <SettingsForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onBabySelect={(id: string) => {
          // Handle baby selection
        }}
        onBabyStatusChange={() => {
          // Refresh babies list
        }}
        selectedBabyId={selectedBabyId}
        familyId={family?.id} // Pass the current family ID
      />
    </>
  );
}
```

## Implementation Details

The form components in this directory follow these patterns:

1. They use the FormPage component from `@/src/components/ui/form-page` for consistent layout and behavior
2. They include FormPageContent for the scrollable form area
3. They include FormPageFooter for action buttons
4. They handle their own data fetching and state management
5. They follow the container/presentational pattern where appropriate
6. They support multi-family functionality by accepting a familyId prop

### Multi-Family Support

The SettingsForm component supports multi-family functionality by:
- Accepting a `familyId` prop to associate settings with a specific family
- Including the family ID in the settings API request payload
- Passing the family ID to child form components (BabyForm, ContactForm)
- The API endpoints also extract the family ID from request headers as a fallback

When using this component in a multi-family context, you should:
1. Import and use the family context to get the current family ID
2. Pass the family ID to the SettingsForm component
3. The component will handle sending this ID to the API and child components

## Mobile Considerations

These form components are designed with mobile-first principles:
- On mobile screens, form content is centered
- On screens above 600px, form content is left-aligned
- All interactive elements have appropriate touch targets
- Forms slide in from the right side of the screen with smooth animations
