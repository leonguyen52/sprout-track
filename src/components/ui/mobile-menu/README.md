# Mobile Menu Component

A responsive mobile menu component that provides hamburger menu functionality for mobile devices while showing desktop navigation on larger screens. Uses the existing dropdown-menu component for a clean, non-modal experience.

## Features

- Hamburger menu button that appears only on mobile devices
- Clean dropdown menu (no modal overlay or backdrop)
- Built on top of the existing dropdown-menu component
- Keyboard navigation support
- Click outside to close functionality
- Automatic closure when resizing to desktop view
- Accessible focus states and ARIA labels
- Smooth transitions and animations

## Props

The MobileMenu component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | The navigation items to display in both desktop and mobile views |
| `className` | `string` | `''` | Additional CSS classes to apply to the container |

## Usage Examples

### Basic Mobile Menu

```tsx
import { MobileMenu } from "@/src/components/ui/mobile-menu"
import { ThemeToggle } from "@/src/components/ui/theme-toggle"
import { AccountButton } from "@/src/components/ui/account-button"

export function Navigation() {
  return (
    <MobileMenu>
      <AccountButton label="Sign In" />
      <AccountButton label="Sign Up" variant="outline" />
      <ThemeToggle />
    </MobileMenu>
  )
}
```

### With Custom Styling

```tsx
import { MobileMenu } from "@/src/components/ui/mobile-menu"

export function CustomNavigation() {
  return (
    <MobileMenu className="custom-nav-class">
      <button>Home</button>
      <button>About</button>
      <button>Contact</button>
    </MobileMenu>
  )
}
```

## Implementation Details

The MobileMenu component is built using:

- React hooks (`useState`, `useEffect`) for state management
- Lucide React icons for hamburger and close buttons
- TailwindCSS for responsive styling
- Portal-like overlay system for mobile menu

The component follows a modular structure:
- `index.tsx` - Main component implementation
- `mobile-menu.styles.ts` - Style definitions using CVA
- `mobile-menu.types.ts` - TypeScript type definitions
- `mobile-menu.css` - Dark mode and custom CSS overrides

## Behavior

### Desktop (768px and above)
- Hamburger button is hidden
- Children are displayed in a horizontal flex layout
- No overlay or menu panel functionality

### Mobile (below 768px)
- Navigation items are hidden by default
- Hamburger menu button is visible
- Clicking the button opens a slide-out panel from the right
- Menu panel contains all navigation items in a vertical layout
- Backdrop overlay prevents interaction with main content
- Menu closes when clicking outside, pressing Escape, or resizing to desktop

## Accessibility

The MobileMenu component includes:
- Proper ARIA labels for hamburger and close buttons
- Keyboard navigation support (Escape key)
- Focus management within the menu
- Screen reader friendly structure
- Proper semantic HTML structure

## Mobile Considerations (React Native)

When adapting this component for React Native, consider the following:

- **Styling**: TailwindCSS classes will need to be replaced with React Native StyleSheet
- **Overlay**: Use React Native's Modal component instead of fixed positioning
- **Animations**: Implement slide animations using React Native's Animated API
- **Touch Handling**: React Native's touch handling is different from web click events
- **Safe Areas**: Consider device safe areas for proper positioning
- **Navigation**: Integration with React Navigation for mobile app navigation

This component follows the project's cross-platform compatibility guidelines by:
1. Separating logic from styling
2. Using a modular file structure
3. Avoiding web-specific APIs in core logic
4. Documenting platform-specific considerations
