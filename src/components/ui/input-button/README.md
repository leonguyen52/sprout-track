# InputButton Component

A versatile input-button combination component that merges the functionality of both Input and Button components with multiple layout options.

## Features

- Multiple layout configurations (button left, right, or below input)
- All button variants from the Button component (default, destructive, outline, secondary, ghost, link, success, info, warning)
- All button sizes (default, sm, lg, xl, icon)
- Email validation support
- Error state handling
- Loading state support
- Dark mode support
- Accessibility features
- Cross-platform compatibility design

## Props

The InputButton component extends all standard HTML input attributes plus the following:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | `'left' \| 'right' \| 'below'` | `'right'` | Position of the button relative to the input |
| `buttonText` | `string` | - | Text content for the button (required) |
| `buttonVariant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' \| 'success' \| 'info' \| 'warning'` | `'default'` | Visual style variant of the button |
| `buttonSize` | `'default' \| 'sm' \| 'lg' \| 'xl' \| 'icon'` | `'default'` | Size variant of the button |
| `onButtonClick` | `(event: React.MouseEvent<HTMLButtonElement>) => void` | - | Button click handler |
| `inputClassName` | `string` | - | Additional CSS classes for the input |
| `buttonClassName` | `string` | - | Additional CSS classes for the button |
| `containerClassName` | `string` | - | Additional CSS classes for the container |
| `buttonDisabled` | `boolean` | `false` | Whether the button is disabled |
| `buttonLoading` | `boolean` | `false` | Whether the button is in loading state |
| `error` | `string` | - | Error message to display below the component |

## Usage Examples

### Basic Email Subscription (Right Layout)

```tsx
import { InputButton } from "@/src/components/ui/input-button"

export function EmailSubscription() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  
  const handleSubscribe = () => {
    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }
    setError("")
    // Handle subscription logic
  }

  return (
    <InputButton
      layout="right"
      type="email"
      placeholder="Enter your email"
      buttonText="Subscribe"
      buttonVariant="success"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onButtonClick={handleSubscribe}
      error={error}
    />
  )
}
```

### Search Input (Left Layout)

```tsx
import { InputButton } from "@/src/components/ui/input-button"

export function SearchInput() {
  const [query, setQuery] = useState("")
  
  const handleSearch = () => {
    // Handle search logic
    console.log("Searching for:", query)
  }

  return (
    <InputButton
      layout="left"
      type="search"
      placeholder="Search..."
      buttonText="🔍"
      buttonVariant="outline"
      buttonSize="icon"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onButtonClick={handleSearch}
    />
  )
}
```

### Form Submission (Below Layout)

```tsx
import { InputButton } from "@/src/components/ui/input-button"

export function ContactForm() {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async () => {
    setLoading(true)
    // Handle form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
  }

  return (
    <InputButton
      layout="below"
      type="text"
      placeholder="Enter your message"
      buttonText="Send Message"
      buttonVariant="default"
      buttonSize="lg"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onButtonClick={handleSubmit}
      buttonLoading={loading}
      containerClassName="max-w-md"
    />
  )
}
```

### All Layout Variations

```tsx
import { InputButton } from "@/src/components/ui/input-button"

export function LayoutExamples() {
  return (
    <div className="space-y-6">
      <div>
        <h3>Button on Left</h3>
        <InputButton
          layout="left"
          buttonText="Go"
          placeholder="Enter text"
          buttonVariant="outline"
        />
      </div>
      
      <div>
        <h3>Button on Right</h3>
        <InputButton
          layout="right"
          buttonText="Submit"
          placeholder="Enter text"
          buttonVariant="success"
        />
      </div>
      
      <div>
        <h3>Button Below</h3>
        <InputButton
          layout="below"
          buttonText="Process"
          placeholder="Enter text"
          buttonVariant="default"
        />
      </div>
    </div>
  )
}
```

## Email Validation Example

```tsx
import { InputButton } from "@/src/components/ui/input-button"
import { useState } from "react"

export function EmailValidationExample() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  const handleSubmit = () => {
    if (!email) {
      setError("Email is required")
      return
    }
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }
    
    setError("")
    // Process valid email
    console.log("Valid email:", email)
  }
  
  return (
    <InputButton
      type="email"
      placeholder="Enter your email address"
      buttonText="Validate"
      buttonVariant="info"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onButtonClick={handleSubmit}
      error={error}
    />
  )
}
```

## Implementation Details

The InputButton component is built using:

- React's `forwardRef` for proper ref forwarding to the input element
- Class Variance Authority (CVA) for variant management
- TailwindCSS for styling with custom CSS for dark mode
- Modular structure separating styles, types, and implementation

The component follows a modular structure:
- `index.tsx` - Main component implementation
- `input-button.styles.ts` - Style definitions using objects and CVA
- `input-button.types.ts` - TypeScript type definitions
- `input-button.css` - Dark mode CSS overrides
- `README.md` - Documentation and usage examples

## Accessibility

The InputButton component includes:
- Proper focus states for both input and button
- Keyboard navigation support
- Screen reader friendly error messages
- Disabled state styling and behavior
- Loading state indication
- Support for all standard input and button attributes including `aria-*` props

## Mobile Considerations (React Native)

When adapting this component for React Native, consider the following:

- **Layout**: The flex-based layouts will translate well to React Native's Flexbox
- **Styling**: TailwindCSS classes will need to be replaced with React Native StyleSheet or NativeWind
- **Input Handling**: React Native's TextInput component has different props and events
- **Button Interaction**: TouchableOpacity or Pressable components will replace the button element
- **Loading States**: React Native's ActivityIndicator will replace the SVG spinner
- **Error Display**: Text component will be used for error messages
- **Dark Mode**: React Native's Appearance API or a theme context will handle dark mode

This component follows the project's cross-platform compatibility guidelines by:
1. Separating logic from styling
2. Using a modular structure that can be adapted for different platforms
3. Avoiding web-specific APIs in the core component logic
4. Documenting all aspects that will need platform-specific implementations
5. Designing with touch interactions in mind (appropriate button sizes)
