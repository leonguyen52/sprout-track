import React, { useState, useEffect } from 'react';
import { useTheme } from '@/src/context/theme';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';
import CalendarDayView from '@/src/components/CalendarDayView';
import { CalendarProps, CalendarState } from './calendar.types';
import { calendarStyles as styles } from './calendar.styles';
import './calendar.css';

/**
 * Calendar Component
 * 
 * A responsive calendar component that displays a monthly view with activity indicators
 * and allows users to view and manage calendar events.
 * 
 * @param selectedBabyId - The ID of the currently selected baby
 * @param userTimezone - The user's timezone for date calculations
 * @param onDateSelect - Optional callback when a date is selected
 */
export function Calendar({ selectedBabyId, userTimezone, onDateSelect }: CalendarProps) {
  const { theme } = useTheme();
  
  // Component state
  const [state, setState] = useState<CalendarState>({
    // Set initial date to April 2025 to match the event in the database
    currentDate: new Date(2025, 3, 1), // April 1, 2025 (months are 0-indexed)
    selectedDate: null,
    calendarDays: [],
    events: []
  });
  
  // Destructure state for easier access
  const {
    currentDate,
    selectedDate,
    calendarDays,
    events
  } = state;
  
  // State update helpers
  const updateState = (updates: Partial<CalendarState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  // We no longer need to fetch babies, caretakers, and contacts here
  // as they are now handled by CalendarDayView

  /**
   * Function to get all days in a month for the calendar
   * and calculate the number of rows needed
   */
  const getDaysInMonth = (year: number, month: number): { days: Date[], rowCount: number } => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    
    // Get the day of the week for the first day of the month (0 = Sunday, 6 = Saturday)
    const firstDayOfMonth = date.getDay();
    
    // Add days from the previous month to fill the first row
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, lastDayOfPrevMonth - i));
    }
    
    // Add all days in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from the next month to complete the last row
    const lastDayOfMonth = new Date(year, month, daysInMonth).getDay();
    const daysToAdd = 6 - lastDayOfMonth;
    for (let i = 1; i <= daysToAdd; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    // Calculate the number of rows needed (total days / 7)
    const rowCount = Math.ceil(days.length / 7);
    
    return { days, rowCount };
  };

  // Track the number of rows needed for the calendar grid
  const [calendarRowCount, setCalendarRowCount] = useState(6);

  /**
   * Update calendar days when the current date changes
   */
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const { days, rowCount } = getDaysInMonth(year, month);
    updateState({ calendarDays: days });
    setCalendarRowCount(rowCount);
  }, [currentDate]);

  /**
   * Fetch events for the selected month
   */
  const fetchEvents = async () => {
    try {
      // Create start date (first day of month) and end date (last day of month)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      // Set to beginning and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      console.log(`Fetching events for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Fetch calendar events
      const eventsResponse = await fetch(
        `/api/calendar-event?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const eventsData = await eventsResponse.json();
      
      console.log("API Response:", eventsResponse.status, eventsResponse.statusText);
      console.log("Fetched events data:", eventsData);
      
      if (eventsData.success && eventsData.data && eventsData.data.length > 0) {
        console.log(`Found ${eventsData.data.length} events for the month`);
        eventsData.data.forEach((event: any, index: number) => {
          console.log(`Event ${index + 1}:`, {
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            date: new Date(event.startTime).toLocaleString(),
            day: new Date(event.startTime).getDate(),
            month: new Date(event.startTime).getMonth(),
            year: new Date(event.startTime).getFullYear()
          });
        });
      } else {
        console.log("No events found for the month or API returned an error");
      }
      
      // Update state with fetched data
      updateState({
        events: eventsData.success ? eventsData.data : []
      });
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };
  
  // Create a ref to store the fetchEvents function
  // This allows us to call the latest version of fetchEvents from event handlers
  const fetchEventsRef = React.useRef(fetchEvents);
  
  // Update the ref whenever fetchEvents changes
  React.useEffect(() => {
    fetchEventsRef.current = fetchEvents;
  }, [fetchEvents]);

  /**
   * Fetch events when the baby or month changes
   */
  useEffect(() => {
    fetchEvents();
  }, [currentDate, userTimezone]);

  // Removed fetchEventsForSelectedDay and its useEffect hook

  /**
   * Navigation handlers
   */
  const goToPreviousMonth = () => {
    updateState({
      currentDate: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    });
  };

  const goToNextMonth = () => {
    updateState({
      currentDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    });
  };

  const goToCurrentMonth = () => {
    updateState({
      currentDate: new Date()
    });
  };

  /**
   * Date formatting and checking helpers
   */
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };
  
  /**
   * Check if an event's UTC date string matches a given local calendar date.
   * Compares the YYYY-MM-DD part of the UTC string with the local date.
   */
  const isSameUTCDay = (eventDateStr: string | Date, localDate: Date): boolean => {
    try {
      // Ensure localDate is a valid Date object
      if (!(localDate instanceof Date) || isNaN(localDate.getTime())) {
        console.error('Invalid localDate provided to isSameUTCDay:', localDate);
        return false;
      }
      
      // Get the YYYY-MM-DD string for the local calendar date
      const localYear = localDate.getFullYear();
      const localMonth = (localDate.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
      const localDay = localDate.getDate().toString().padStart(2, '0');
      const localDateString = `${localYear}-${localMonth}-${localDay}`;
      
      // Get the YYYY-MM-DD string from the event's UTC date string
      let eventDateUTCString: string;
      if (eventDateStr instanceof Date) {
        eventDateUTCString = eventDateStr.toISOString().split('T')[0];
      } else if (typeof eventDateStr === 'string') {
        // Attempt to parse the string and extract the date part
        const parsedDate = new Date(eventDateStr);
        if (isNaN(parsedDate.getTime())) {
          console.warn(`Invalid date string in isSameUTCDay: ${eventDateStr}`);
          return false;
        }
        eventDateUTCString = parsedDate.toISOString().split('T')[0];
      } else {
        console.warn(`Invalid eventDateStr type in isSameUTCDay: ${typeof eventDateStr}`);
        return false;
      }
      
      // Compare the date strings
      const result = eventDateUTCString === localDateString;
      
      // Optional: Log for debugging
      // console.log(`Comparing UTC event date ${eventDateUTCString} with local calendar date ${localDateString}. Result: ${result}`);
      
      return result;
    } catch (error) {
      console.error('Error in isSameUTCDay:', error, { eventDateStr, localDate });
      return false;
    }
  };

  /**
   * Get events for a specific day
   */
  const getEventsForDay = (date: Date): any[] => {
    if (!events || events.length === 0) {
      return [];
    }
    
    if (!events || events.length === 0) {
      return [];
    }
    
    // Filter events whose UTC start time falls on the given local calendar date
    return events.filter((event: any) => {
      if (!event.startTime) {
        console.warn(`Event missing startTime: ${event.id}`);
        return false;
      }
      return isSameUTCDay(event.startTime, date);
    });
  };

  /**
   * Event handlers
   */
  const handleDayClick = (date: Date) => {
    updateState({ selectedDate: date });
    
    // Call the onDateSelect callback if provided
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleEventClick = (event: any) => {
    // This is now handled by CalendarDayView
    // Just pass the event through
  };

  const handleAddEvent = (date: Date) => {
    // Update the selected date
    updateState({
      selectedDate: date
    });
    
    // Refresh events after an event is added, edited, or deleted
    fetchEventsRef.current();
  };

  // These functions are now handled by CalendarDayView

  /**
   * Get day cell class based on date
   */
  const getDayClass = (date: Date): string => {
    const baseClass = "flex flex-col h-full min-h-[60px] p-1 border border-gray-200 cursor-pointer calendar-day";
    let className = baseClass;
    
    if (isToday(date)) {
      className = cn(className, "bg-teal-50 border-teal-300 calendar-day-today");
    } else if (!isCurrentMonth(date)) {
      className = cn(className, "bg-gray-50 text-gray-400 calendar-day-other-month");
    } else {
      className = cn(className, "calendar-day-current-month");
    }
    
    // Add selected state (compare using local date components)
    if (selectedDate && 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()) {
      className = cn(className, "ring-2 ring-teal-500 ring-inset calendar-day-selected");
    }
    
    return className;
  };

  /**
   * Render calendar event indicators
   */
  const renderActivityIndicators = (date: Date) => {
    // Get events for this day
    const dayEvents = getEventsForDay(date);
    
    // Only show indicators if there are calendar events for this day
    if (dayEvents.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-1 mt-auto">
        {dayEvents.map((event, index) => {
          // If the event has a custom color, use it
          if (event.color) {
            return (
              <div 
                key={index} 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: event.color }}
                title={event.title}
              />
            );
          }
          
          // Otherwise use default colors based on event type
          let bgColor = '';
          switch (event.type) {
            case 'APPOINTMENT':
              bgColor = 'bg-blue-500 calendar-indicator-appointment';
              break;
            case 'CARETAKER_SCHEDULE':
              bgColor = 'bg-green-500 calendar-indicator-caretaker';
              break;
            case 'REMINDER':
              bgColor = 'bg-yellow-500 calendar-indicator-reminder';
              break;
            case 'CUSTOM':
              bgColor = 'bg-purple-500 calendar-indicator-custom';
              break;
            default:
              bgColor = 'bg-gray-500 calendar-indicator-default';
          }
          
          return (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full ${bgColor}`} 
              title={event.title}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full calendar-container">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white border-t border-gray-200 calendar-header">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="text-white hover:bg-teal-500/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold">{formatMonthYear(currentDate)}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="text-xs text-white/80 hover:text-white hover:bg-teal-500/20 py-0 h-6"
          >
            Today
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="text-white hover:bg-teal-500/20"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-white calendar-content" style={{ minHeight: `${calendarRowCount * 60}px` }}>
        {/* Calendar Grid */}
        <Card className="flex-1 overflow-hidden border-0 rounded-t-none calendar-grid flex md:flex-col">
          <div className="h-full flex flex-col">
            {/* Day names header */}
            <div className="grid grid-cols-7 text-center bg-gray-100 border-b border-gray-200 calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={index} className="py-2 text-xs font-medium text-gray-500 calendar-weekday">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div 
              className="grid grid-cols-7 h-[calc(100%-32px)] calendar-days"
              style={{ '--calendar-row-count': calendarRowCount } as React.CSSProperties}
            >
              {calendarDays.map((date, index) => (
                <div 
                  key={index} 
                  className={`${getDayClass(date)} cursor-pointer`}
                  onClick={() => handleDayClick(date)}
                >
                  <span className={`text-xs ${isToday(date) ? 'font-bold text-teal-700 calendar-today-text' : ''}`}>
                    {date.getDate()}
                  </span>
                  {renderActivityIndicators(date)}
                </div>
              ))}
            </div>
          </div>
        </Card>
        
        {/* Day view as a modal */}
        <CalendarDayView
          date={selectedDate || new Date()}
          events={selectedDate ? getEventsForDay(selectedDate) : []}
          onEventClick={handleEventClick}
          onAddEvent={handleAddEvent}
          className="calendar-day-view-slide-in"
          onClose={() => updateState({ selectedDate: null })}
          isOpen={selectedDate !== null}
        />
      </div>
      
      {/* Add event button (only shown on mobile when no date is selected) */}
      {!selectedDate && (
        <div className="md:hidden fixed bottom-4 right-4">
          <Button
            onClick={() => handleAddEvent(new Date())}
            className="rounded-full w-12 h-12 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
      
      {/* Event form is now handled by CalendarDayView */}
    </div>
  );
}
