# Account Button Component

A smart authentication button that adapts based on the user's login status, providing access to account functionality and user actions.

## Features

- **Adaptive Display**: Shows different content based on authentication status
- **Guest State**: "Account" button that opens login/registration modal
- **Logged-in State**: "Hi, [Name]" button with dropdown menu
- **Automatic Status Detection**: Checks localStorage for authentication tokens
- **Cross-tab Synchronization**: Updates when user logs in/out in another tab
- **Dark Mode Support**: Full theming for light and dark modes
- **Secure Logout**: Calls server-side logout API and clears all auth data
- **Family Navigation**: Direct link to user's family dashboard

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes to apply |

## Usage Examples

### Basic Usage

```tsx
import { AccountButton } from "@/src/components/ui/account-button";

export function Header() {
  return (
    <div className="header">
      <AccountButton />
    </div>
  );
}
```

### With Custom Styling

```tsx
import { AccountButton } from "@/src/components/ui/account-button";

export function Navigation() {
  return (
    <nav className="navigation">
      <AccountButton className="ml-4" />
    </nav>
  );
}
```

## States

### Guest State (Not Logged In)
- Displays: "Account" button with User icon
- Action: Opens AccountModal in registration mode (with easy switch to login)
- Styling: Teal border and text, transparent background

### Logged-in State (Authenticated)
- Displays: "Hi, [FirstName]" button with User icon
- Action: Opens dropdown menu with user options
- Styling: Emerald border and text, transparent background

## Dropdown Menu Options

When logged in, the dropdown includes:

1. **User Info Header**
   - User's first name
   - Email address

2. **Go to Family Dashboard**
   - Icon: Home
   - Action: Navigates to `/{familySlug}`

3. **Log out**
   - Icon: LogOut
   - Action: Calls logout API and clears auth data

## Authentication Flow

### Login Detection
1. Checks `localStorage.authToken` for JWT token
2. Checks `localStorage.accountUser` for user information
3. Updates component state based on token presence
4. Listens for storage events to sync across tabs

### Logout Process
1. Calls `/api/auth/logout` to invalidate server-side token
2. Clears all authentication data from localStorage:
   - `authToken`
   - `accountUser`
   - `unlockTime`
   - `caretakerId`
3. Updates component state
4. Redirects to home page

### Storage Format

The component expects user data in localStorage as:

```json
{
  "firstName": "John",
  "email": "john@example.com",
  "familySlug": "smith-family"
}
```

## Styling

### CSS Classes
- `.account-button-guest` - Button styling when not logged in
- `.account-button-logged-in` - Button styling when logged in

### Color Scheme
- **Guest State**: Teal (`#0d9488`) with hover effects
- **Logged-in State**: Emerald (`#059669`) with hover effects
- **Dark Mode**: Lighter teal/emerald variants with proper contrast

### Responsive Design
- Mobile-optimized padding and font sizes
- Proper touch targets for mobile devices
- Icon scaling for different screen sizes

## Accessibility

### Features Included
- **Keyboard Navigation**: Full keyboard support for dropdown
- **Focus States**: Visible focus indicators
- **ARIA Labels**: Proper labeling for screen readers
- **Color Contrast**: WCAG AA compliant in light and dark modes

### Focus Management
- Custom focus styles with 2px outline
- Different colors for light/dark modes
- Proper outline offset for visibility

## Security Considerations

### Token Management
- Automatically detects expired/invalid tokens
- Graceful handling of corrupted localStorage data
- Secure logout with server-side token invalidation

### Error Handling
- Continues logout process even if API call fails
- Robust JSON parsing with error fallbacks
- Clean state management on authentication errors

## Integration

### Dependencies
- Radix UI DropdownMenu for accessible dropdown behavior
- Lucide React for consistent iconography
- Local Button component for styling consistency
- AccountModal component for authentication flows

### API Integration
- **Registration/Login**: Uses AccountModal which defaults to registration mode and calls `/api/accounts/register` or `/api/accounts/login`
- **Logout**: Calls `/api/auth/logout` with Bearer token
- **Navigation**: Redirects to family-specific routes

## Future Enhancements

### Planned Features
1. **Profile Management**: Quick access to account settings
2. **Notifications**: Badge indicator for important updates
3. **Quick Actions**: Shortcuts to common family actions
4. **Multi-Family Support**: Family switching dropdown
5. **Avatar Support**: Profile picture display

### Mobile Considerations (React Native)

When adapting for React Native:
- Replace DropdownMenu with custom Modal/ActionSheet
- Use React Native's AsyncStorage instead of localStorage
- Implement platform-specific navigation
- Adapt styling to React Native StyleSheet
- Handle authentication state with React Native's AppState

## Testing Considerations

### Unit Tests
- Authentication state detection
- Logout functionality
- Cross-tab synchronization
- Error handling scenarios

### Integration Tests
- Login/logout flow with API
- localStorage management
- Navigation behavior
- Modal integration

### E2E Tests
- Complete authentication workflow
- Dropdown menu interactions
- Cross-tab behavior
- Responsive design validation

## Performance

### Optimizations
- Minimal re-renders with proper state management
- Efficient localStorage polling
- Lazy loading of AccountModal
- Optimized icon rendering

### Memory Management
- Proper event listener cleanup
- State cleanup on unmount
- Efficient storage event handling