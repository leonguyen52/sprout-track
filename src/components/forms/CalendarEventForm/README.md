# CalendarEventForm Component

A comprehensive form component for creating and editing calendar events in the Baby Tracker application. This component provides a rich user interface for managing event details, recurrence patterns, reminders, and associated people.

## Features

- Create and edit calendar events
- Set event details (title, type, date/time, location, description)
- Configure recurring events with various patterns
- Set reminders for events
- Associate events with babies, caretakers, and contacts
- Custom color selection for events
- Form validation with error messages
- Loading state handling
- Responsive design for mobile and desktop
- Dark mode support
- Accessible UI with proper semantic structure

## Usage

```tsx
import { CalendarEventForm } from '@/src/components/forms/CalendarEventForm';
import { useState } from 'react';

function CalendarPage() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [babies, setBabies] = useState([]);
  const [caretakers, setCaretakers] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  const handleSaveEvent = async (eventData) => {
    try {
      // Save event to database
      const response = await fetch('/api/calendar-event', {
        method: eventData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        // Handle success
        setShowEventForm(false);
        // Refresh events
      } else {
        // Handle error
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };
  
  return (
    <div>
      <button onClick={() => setShowEventForm(true)}>
        Add Event
      </button>
      
      <CalendarEventForm
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        event={selectedEvent}
        onSave={handleSaveEvent}
        babies={babies}
        caretakers={caretakers}
        contacts={contacts}
      />
    </div>
  );
}
```

## Component API

### CalendarEventForm

Main component for creating and editing calendar events.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `isOpen` | `boolean` | Whether the form is open | Required |
| `onClose` | `() => void` | Handler for when the form is closed | Required |
| `event` | `CalendarEventFormData` | The event to edit (undefined for new events) | `undefined` |
| `onSave` | `(event: CalendarEventFormData) => void` | Handler for when the form is submitted | Required |
| `initialDate` | `Date` | Initial date for new events | Current date |
| `babies` | `Baby[]` | Available babies to select | Required |
| `caretakers` | `Caretaker[]` | Available caretakers to select | Required |
| `contacts` | `Contact[]` | Available contacts to select | Required |
| `isLoading` | `boolean` | Whether the form is in a loading state | `false` |

### CalendarEventFormData

Interface representing the form data for a calendar event.

```typescript
interface CalendarEventFormData {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
  type: CalendarEventType; // APPOINTMENT, CARETAKER_SCHEDULE, REMINDER, CUSTOM
  location?: string;
  color?: string;
  
  // Recurrence fields
  recurring: boolean;
  recurrencePattern?: RecurrencePattern; // DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY, CUSTOM
  recurrenceEnd?: Date;
  customRecurrence?: string;
  
  // Notification fields
  reminderTime?: number; // Minutes before event
  
  // Related entities
  babyIds: string[];
  caretakerIds: string[];
  contactIds: string[];
}
```

## Subcomponents

### RecurrenceSelector

A subcomponent for selecting recurrence patterns for recurring events.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `recurring` | `boolean` | Whether the event is recurring | Required |
| `recurrencePattern` | `RecurrencePattern` | The recurrence pattern | `undefined` |
| `recurrenceEnd` | `Date` | When the recurrence ends | `undefined` |
| `onRecurringChange` | `(recurring: boolean) => void` | Handler for when recurring changes | Required |
| `onRecurrencePatternChange` | `(pattern: RecurrencePattern) => void` | Handler for when pattern changes | Required |
| `onRecurrenceEndChange` | `(date: Date \| undefined) => void` | Handler for when end date changes | Required |
| `error` | `{ recurrencePattern?: string; recurrenceEnd?: string; }` | Validation errors | `undefined` |

### ContactSelector

A subcomponent for selecting contacts for calendar events.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `contacts` | `Contact[]` | Available contacts | Required |
| `selectedContactIds` | `string[]` | IDs of selected contacts | Required |
| `onContactsChange` | `(contactIds: string[]) => void` | Handler for when selection changes | Required |
| `onAddNewContact` | `() => void` | Handler for adding a new contact | `undefined` |

## Form Sections

The form is organized into several sections:

1. **Event Details**
   - Title
   - Event Type
   - All Day toggle
   - Start Date/Time
   - End Date/Time
   - Location
   - Description
   - Color

2. **Recurrence**
   - Recurring toggle
   - Recurrence Pattern (Daily, Weekly, Biweekly, Monthly, Yearly, Custom)
   - Recurrence End Date

3. **Reminder**
   - Reminder Time (None, At time of event, 5/10/15/30 minutes before, 1/2 hours before, 1 day before)

4. **People**
   - Babies
   - Caretakers
   - Contacts

## Implementation Details

The component is built using:
- React with TypeScript for type safety
- React Hooks for state management
- Tailwind CSS for styling
- Lucide React for icons
- CSS modules for component-specific styles

The component follows a modular structure:
- `index.tsx` - Main component implementation
- `RecurrenceSelector.tsx` - Subcomponent for recurrence options
- `ContactSelector.tsx` - Subcomponent for contact selection
- `calendar-event-form.styles.ts` - Style definitions using Tailwind CSS
- `calendar-event-form.types.ts` - TypeScript type definitions
- `calendar-event-form.css` - Additional CSS for dark mode and animations

## Accessibility

The component includes:
- Proper semantic HTML structure with appropriate heading levels
- Form labels associated with inputs
- Required field indicators
- Error messages for invalid inputs
- ARIA labels for buttons
- Keyboard navigable interactive elements
- Focus management
- Color contrast that meets WCAG guidelines

## Cross-Platform Considerations

This component is designed with cross-platform compatibility in mind:

- Uses standard React patterns that can be adapted to React Native
- Avoids web-specific APIs (except for date/time inputs, which would need custom implementations in React Native)
- Uses relative sizing that can be adapted to different screen sizes
- Implements touch-friendly button sizes
- Separates styling from component logic for easier platform adaptation

When converting to React Native, the form inputs would need to be replaced with React Native equivalents, and the modal would need to be implemented using React Native's Modal component. The date and time pickers would need custom implementations using React Native's DateTimePicker.
