# Calendar Component

A responsive calendar component for the Baby Tracker application that displays a monthly view with activity indicators.

## Features

- Monthly calendar view with navigation controls
- Highlights the current day
- Displays activity indicators for each day
- Supports dark mode
- Responsive design for mobile and desktop
- Fetches and displays activities from the timeline API
- Handles timezone differences correctly

## Usage

### Basic Usage

```tsx
import { Calendar } from '@/src/components/Calendar';

function CalendarPage() {
  const { userTimezone } = useTimezone();
  
  return (
    <div className="h-full">
      <Calendar userTimezone={userTimezone} />
    </div>
  );
}
```

## Component API

### Calendar

Main component for displaying a monthly calendar with activity indicators.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `onDateSelect` | `(date: Date) => void` | Optional callback when a date is selected | `undefined` |
| `userTimezone` | `string` | The user's timezone for date calculations | Required |

## Visual Behavior

- Displays a monthly calendar grid with days of the week as column headers
- Current day is highlighted with a different background color
- Days from previous/next months are shown with reduced opacity
- Activity indicators appear as colored dots at the bottom of each day cell
- Month and year are displayed in the header
- Navigation buttons allow moving to previous/next months
- "Today" button returns to the current month
- The component will handle sending this timezone to the API

## Implementation Details

The component is responsible for:
1. Generating the calendar grid for the current month
2. Fetching activities for the selected baby and month
3. Displaying activity indicators for days with activities
4. Handling month navigation
5. Highlighting the current day

## Activity Indicators

Activity indicators are displayed as colored dots at the bottom of each day cell:
- Sleep: Gray
- Feed: Blue
- Diaper: Teal
- Note: Yellow
- Bath: Orange
- Other: Purple

## Timezone Handling

The Calendar component handles timezone differences by:
1. Using the user's timezone for all date calculations
2. Passing the timezone to the API when fetching activities
3. Ensuring consistent date display regardless of the user's location

## Cross-Platform Considerations

This component is designed with cross-platform compatibility in mind:

- Uses standard React patterns that can be adapted to React Native
- Avoids web-specific APIs
- Uses relative sizing that can be adapted to different screen sizes
- Implements touch-friendly button sizes
- Handles timezone differences in a platform-agnostic way

When converting to React Native, the grid layout would need to be implemented using React Native's `View` and `FlatList` components instead of CSS grid. The date handling would remain largely the same, as it uses standard JavaScript Date APIs that are available in React Native.
