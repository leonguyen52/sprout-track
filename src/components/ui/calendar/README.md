# Calendar Component

A custom calendar component with styled appearance that follows the project's design system. It's designed to be cross-platform compatible with minimal changes required for React Native. Includes dark mode support and page-based navigation.

## Features

- Month navigation with previous/next buttons
- **Page-based month and year selection** - No dropdown overlays that can be clipped by containers
- Date selection with customizable callbacks
- Date range selection with visual indicators
- Support for disabled dates
- Highlighting of today's date
- Responsive design with different size variants
- Styled with the app's emerald and gray color scheme
- Dark mode support with consistent styling

## Usage

```tsx
import { Calendar } from '@/src/components/ui/calendar';

// Basic usage (single date selection)
<Calendar 
  selected={selectedDate}
  onSelect={setSelectedDate}
/>

// With variant
<Calendar 
  selected={selectedDate}
  onSelect={setSelectedDate}
  variant="compact"
/>

// With date constraints
<Calendar 
  selected={selectedDate}
  onSelect={setSelectedDate}
  minDate={new Date(2023, 0, 1)}
  maxDate={new Date(2023, 11, 31)}
/>

// With disabled dates
<Calendar 
  selected={selectedDate}
  onSelect={setSelectedDate}
  disabledDates={[new Date(2023, 5, 15), new Date(2023, 5, 16)]}
/>

// With custom disabled date function
<Calendar 
  selected={selectedDate}
  onSelect={setSelectedDate}
  isDateDisabled={(date) => date.getDay() === 0 || date.getDay() === 6} // Disable weekends
/>

// Date range selection
<Calendar 
  mode="range"
  rangeFrom={fromDate}
  rangeTo={toDate}
  onRangeChange={(from, to) => {
    setFromDate(from);
    setToDate(to);
  }}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `"single" \| "range"` | Selection mode - single date or date range |
| `selected` | `Date \| undefined` | The currently selected date (for single date mode) |
| `onSelect` | `(date: Date) => void` | Callback function when a date is selected (for single date mode) |
| `rangeFrom` | `Date \| undefined` | The start date of the selected range (for range mode) |
| `rangeTo` | `Date \| undefined` | The end date of the selected range (for range mode) |
| `onRangeChange` | `(from: Date \| null, to: Date \| null) => void` | Callback function when a date range is selected |
| `month` | `Date` | The month to display (defaults to current month) |
| `className` | `string` | Additional CSS classes |
| `variant` | `"default" \| "compact" \| "date-time-picker"` | Size variant of the calendar |
| `minDate` | `Date` | Minimum selectable date |
| `maxDate` | `Date` | Maximum selectable date |
| `disabledDates` | `Date[]` | Array of dates to disable |
| `isDateDisabled` | `(date: Date) => boolean` | Function to determine if a date should be disabled |
| `initialFocus` | `boolean` | Whether to focus the calendar initially |

## Page-Based Navigation

The calendar uses a page-based navigation system instead of dropdown overlays for month/year selection. This approach prevents issues with:

- Dropdown overlays being clipped by containers with `overflow: hidden`
- Z-index conflicts with modal dialogs and form pages
- Complex portal rendering and positioning calculations

### Navigation Pages:

1. **Dates Page (default)**: Shows the standard calendar grid with date selection
2. **Months Page**: Shows a 3-column grid of month names for selection
3. **Years Page**: Shows a 3-column grid of years with pagination (12 years per page)

### Navigation Flow:

- Click on the month name → Navigate to months page
- Click on the year → Navigate to years page  
- Select a month/year → Automatically returns to dates page
- "Back to Calendar" button available on both selector pages

### Components:

- `MonthSelectorPage.tsx` - Handles month selection with year navigation
- `YearSelectorPage.tsx` - Handles year selection with decade pagination
- Main calendar manages page state and transitions

## Styling

The calendar uses the app's design system with emerald and gray colors. Selected dates use a gradient from teal to emerald, matching the app's primary button style. The calendar also includes proper hover states and accessibility features.

## Dark Mode Support

The calendar includes built-in dark mode support:

1. **Styling Approach**: Uses a hybrid approach with:
   - Tailwind dark mode classes (e.g., `dark:bg-gray-600`) in the styles definition
   - Component-specific CSS overrides in `calendar.css` for consistent dark mode appearance
2. **Theme Context**: Integrates with the application's theme context to maintain theme state

The dark mode styling includes:
- Dark gray background (`gray-600`)
- Light text colors for better contrast
- Adjusted hover and active states
- Consistent styling across all sub-components

## Implementation Details

The Calendar component is built using:

- React's `useMemo` for efficient date calculations
- Tailwind CSS for styling with smooth transitions
- Lucide React for icons
- Class Variance Authority (CVA) for style variants
- Theme context for dark mode support

The component follows a modular structure:
- `index.tsx` - Main component implementation with page-based navigation
- `MonthSelectorPage.tsx` - Month selection page component
- `YearSelectorPage.tsx` - Year selection page component  
- `calendar.styles.ts` - Style definitions using Tailwind classes
- `calendar.types.ts` - TypeScript type definitions and page navigation types
- `calendar.css` - Additional CSS for dark mode styling

## Mobile Considerations (React Native)

When adapting this component for React Native, consider the following:

- Replace Tailwind classes with React Native StyleSheet
- Use React Native's Pressable instead of buttons
- Implement custom date handling for React Native
- Adjust styling to match React Native's layout system
- **Dark Mode**: Implement theme switching using React Native's appearance API or a custom theme context

This component follows the project's cross-platform compatibility guidelines by:
1. Keeping the core logic separate from styling
2. Using a modular structure that can be adapted for different platforms
3. Implementing touch-friendly interactions that work well on mobile
4. Providing clear documentation for platform-specific adaptations
5. Using a theme approach that can be adapted for React Native
