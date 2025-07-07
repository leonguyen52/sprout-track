import { CalendarEventType, RecurrencePattern } from '@prisma/client';
import { Baby } from '@/src/components/CalendarEvent/calendar-event.types';
import { Caretaker } from '@/src/components/CalendarEvent/calendar-event.types';
import { Contact } from '@/src/components/CalendarEvent/calendar-event.types';

/**
 * Type definitions for the CalendarEventForm component
 */

export interface CalendarEventFormProps {
  /**
   * Whether the form is open
   */
  isOpen: boolean;
  
  /**
   * Handler for when the form is closed
   */
  onClose: () => void;
  
  /**
   * The event to edit (undefined for new events)
   */
  event?: CalendarEventFormData;
  
  /**
   * Handler for when the form is submitted
   */
  onSave: (event: CalendarEventFormData) => void;
  
  /**
   * Initial date for new events
   */
  initialDate?: Date;
  
  /**
   * Available babies to select
   */
  babies: Baby[];
  
  /**
   * Available caretakers to select
   */
  caretakers: Caretaker[];
  
  /**
   * Available contacts to select
   */
  contacts: Contact[];
  
  /**
   * Whether the form is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * The ID of the family this event belongs to (for multi-family support)
   */
  familyId?: string;
}

/**
 * Form data for calendar events
 */
export interface CalendarEventFormData {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
  type: CalendarEventType;
  location?: string;
  color?: string;
  
  // Recurrence fields
  recurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEnd?: Date;
  customRecurrence?: string;
  
  // Notification fields
  reminderTime?: number;
  
  // Related entities
  babyIds: string[];
  caretakerIds: string[];
  contactIds: string[];
  
  // Multi-family support
  familyId?: string;
  
  // Special flag for deletion
  _deleted?: boolean;
}

/**
 * Form errors
 */
export interface CalendarEventFormErrors {
  title?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  recurrencePattern?: string;
  recurrenceEnd?: string;
  reminderTime?: string;
}
