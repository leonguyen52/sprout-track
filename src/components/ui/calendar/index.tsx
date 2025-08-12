'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import './calendar.css'; // Import the CSS file with dark mode overrides

import {
  calendarVariants,
  calendarHeaderVariants,
  calendarNavButtonVariants,
  calendarMonthSelectVariants,
  calendarSelectorDropdownVariants,
  calendarSelectorOptionVariants,
  calendarDayVariants,
  calendarDayNamesVariants,
  calendarDayNameVariants,
} from './calendar.styles';
import { CalendarProps } from './calendar.types';

/**
 * Calendar component
 * 
 * A custom calendar component with styled appearance that follows the project's design system.
 * It's designed to be cross-platform compatible with minimal changes required for React Native.
 *
 * Features:
 * - Month navigation with previous/next buttons
 * - Date selection with customizable callbacks
 * - Support for disabled dates
 * - Highlighting of today's date
 * - Responsive design with different size variants
 * - Date range selection support
 *
 * @example
 * ```tsx
 * // Single date selection
 * <Calendar 
 *   selected={selectedDate}
 *   onSelect={setSelectedDate}
 *   variant="default"
 * />
 * 
 * // Date range selection
 * <Calendar 
 *   mode="range"
 *   rangeFrom={fromDate}
 *   rangeTo={toDate}
 *   onRangeChange={(from, to) => {
 *     setFromDate(from);
 *     setToDate(to);
 *   }}
 * />
 * ```
 */
const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ 
    className,
    variant = "default",
    selected,
    onSelect,
    rangeFrom,
    rangeTo,
    onRangeChange,
    mode = "single",
    month: monthProp,
    minDate,
    maxDate,
    disabledDates = [],
    isDateDisabled,
    initialFocus,
    ...props 
  }, ref) => {
    // State for the currently displayed month
    const [month, setMonth] = React.useState(() => {
      return monthProp || (selected || rangeFrom || new Date());
    });
    
    // State for range selection
    const [rangeSelectionState, setRangeSelectionState] = React.useState<'start' | 'end'>(
      rangeFrom && !rangeTo ? 'end' : 'start'
    );
    
    // State for month/year selectors
    const [showMonthSelector, setShowMonthSelector] = React.useState(false);
    const [showYearSelector, setShowYearSelector] = React.useState(false);

    // Update month when monthProp changes
    React.useEffect(() => {
      if (monthProp) {
        setMonth(monthProp);
      }
    }, [monthProp]);

    // Get the first day of the month
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate days from previous month to display
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate total days in the current month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Calculate how many days to show from the next month to complete the grid
    const daysFromNextMonth = 42 - daysFromPrevMonth - daysInMonth;

    // Function to navigate to the previous month
    const handlePrevMonth = () => {
      setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    };

    // Function to navigate to the next month
    const handleNextMonth = () => {
      setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    };

    // Function to check if a date is disabled
    const isDisabled = (date: Date) => {
      // Check if date is in disabledDates array
      const isInDisabledDates = disabledDates.some(
        disabledDate => 
          disabledDate.getFullYear() === date.getFullYear() &&
          disabledDate.getMonth() === date.getMonth() &&
          disabledDate.getDate() === date.getDate()
      );

      // Check if date is before minDate
      const isBeforeMinDate = minDate ? date < minDate : false;

      // Check if date is after maxDate
      const isAfterMaxDate = maxDate ? date > maxDate : false;

      // Check if date is disabled by custom function
      const isDisabledByFunction = isDateDisabled ? isDateDisabled(date) : false;

      return isInDisabledDates || isBeforeMinDate || isAfterMaxDate || isDisabledByFunction;
    };

    // Function to check if a date is today
    const isToday = (date: Date) => {
      const today = new Date();
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    };

    // Helper to compare dates (ignoring time)
    const isSameDay = (date1: Date | null | undefined, date2: Date | null | undefined): boolean => {
      if (!date1 || !date2) return false;
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    };
    
    // Function to check if a date is selected (for single date mode OR first click in range mode)
    const isSelected = (date: Date) => {
      if (mode === "single") {
        return isSameDay(date, selected);
      } else if (mode === "range") {
        // Highlight the first selected date when waiting for the second
        return isSameDay(date, rangeFrom) && !rangeTo;
      }
      return false;
    };
    
    // Function to check if a date is the range start (only when range is complete)
    const isRangeStart = (date: Date) => {
      return mode === "range" && rangeFrom && rangeTo && isSameDay(date, rangeFrom);
    };
    
    // Function to check if a date is the range end (only when range is complete)
    const isRangeEnd = (date: Date) => {
      return mode === "range" && rangeFrom && rangeTo && isSameDay(date, rangeTo);
    };
    
    // Function to check if a date is in the middle of the range (only when range is complete)
    const isInRange = (date: Date) => {
      if (mode !== "range" || !rangeFrom || !rangeTo) return false;
      
      // Ensure dates are compared without time
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      
      const normalizedFrom = new Date(rangeFrom);
      normalizedFrom.setHours(0, 0, 0, 0);
      
      const normalizedTo = new Date(rangeTo);
      normalizedTo.setHours(0, 0, 0, 0);
      
      return normalizedDate > normalizedFrom && normalizedDate < normalizedTo;
    };

    // Function to format date for display
    const formatDate = (date: Date | null | undefined) => {
      if (!date) return '';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Function to handle month selection
    const handleMonthSelect = (monthIndex: number) => {
      const newMonth = new Date(month.getFullYear(), monthIndex, 1);
      setMonth(newMonth);
      setShowMonthSelector(false);
    };
    
    // Function to handle year selection
    const handleYearSelect = (year: number) => {
      const newMonth = new Date(year, month.getMonth(), 1);
      setMonth(newMonth);
      setSelectedYear(year);
      setShowYearSelector(false);
    };
    
    // Functions for year navigation
    const handlePrevYear = () => {
      if (selectedYear > minYear) {
        setSelectedYear(selectedYear - 1);
      }
    };
    
    const handleNextYear = () => {
      if (selectedYear < maxYear) {
        setSelectedYear(selectedYear + 1);
      }
    };
    
    // Function to close selectors when clicking outside
    const handleClickOutside = React.useCallback((event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.month-selector-container') && !target.closest('.year-selector-container')) {
        setShowMonthSelector(false);
        setShowYearSelector(false);
      }
    }, []);
    
    React.useEffect(() => {
      if (showMonthSelector || showYearSelector) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showMonthSelector, showYearSelector, handleClickOutside]);

    // Function to handle date selection
    const handleDateSelect = (date: Date) => {
      if (isDisabled(date)) return;

      if (mode === "single") {
        if (onSelect) onSelect(date);
      } else if (mode === "range" && onRangeChange) {
        // Normalize the clicked date to remove time component for comparison
        const clickedDay = new Date(date);
        clickedDay.setHours(0, 0, 0, 0);

        if (rangeSelectionState === 'start') {
          // First click: Set the start date, clear the end date
          onRangeChange(clickedDay, null);
          setRangeSelectionState('end'); // Move to selecting the end date
        } else { // rangeSelectionState === 'end'
          // Second click: Set the end date
          if (rangeFrom) {
            const normalizedFrom = new Date(rangeFrom);
            normalizedFrom.setHours(0, 0, 0, 0);

            // Only set the end date if it's strictly after the start date
            if (clickedDay > normalizedFrom) {
              onRangeChange(rangeFrom, clickedDay);
              setRangeSelectionState('start'); // Reset to start selection for next range
            } else if (isSameDay(clickedDay, normalizedFrom)) {
              // If the same day is clicked again, reset the selection
              onRangeChange(null, null);
              setRangeSelectionState('start');
            }
            // If clickedDay < normalizedFrom, do nothing (as per requirement 3)
          } else {
            // Should not happen if logic is correct, but as a fallback, start a new range
            onRangeChange(clickedDay, null);
            setRangeSelectionState('end');
          }
        }
      }
    };

    // Generate days for the calendar
    const days = React.useMemo(() => {
      const result = [];
      
      // Add days from previous month
      const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
      const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
      
      for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
        const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i);
        result.push({
          date,
          dayOfMonth: i,
          isOutsideMonth: true,
          isDisabled: isDisabled(date),
          isToday: isToday(date),
          isSelected: isSelected(date), // Will highlight 'from' date when 'to' is null
          isRangeStart: isRangeStart(date), // Only true when range is complete
          isRangeEnd: isRangeEnd(date),     // Only true when range is complete
          isInRange: isInRange(date),       // Only true when range is complete
        });
      }
      
      // Add days from current month
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(month.getFullYear(), month.getMonth(), i);
        result.push({
          date,
          dayOfMonth: i,
          isOutsideMonth: false,
          isDisabled: isDisabled(date),
          isToday: isToday(date),
          isSelected: isSelected(date), // Will highlight 'from' date when 'to' is null
          isRangeStart: isRangeStart(date), // Only true when range is complete
          isRangeEnd: isRangeEnd(date),     // Only true when range is complete
          isInRange: isInRange(date),       // Only true when range is complete
        });
      }
      
      // Add days from next month
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      
      for (let i = 1; i <= daysFromNextMonth; i++) {
        const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
        result.push({
          date,
          dayOfMonth: i,
          isOutsideMonth: true,
          isDisabled: isDisabled(date),
          isToday: isToday(date),
          isSelected: isSelected(date), // Will highlight 'from' date when 'to' is null
          isRangeStart: isRangeStart(date), // Only true when range is complete
          isRangeEnd: isRangeEnd(date),     // Only true when range is complete
          isInRange: isInRange(date),       // Only true when range is complete
        });
      }
      
      return result;
    }, [month, selected, rangeFrom, rangeTo, disabledDates, minDate, maxDate, isDateDisabled, mode, rangeSelectionState]); // Added rangeSelectionState dependency

    // Day names for the calendar header
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Month names for the month selector
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Year selector state and constraints
    const currentYear = new Date().getFullYear();
    const minYear = 1975;
    const maxYear = currentYear;
    const [selectedYear, setSelectedYear] = React.useState(month.getFullYear());
    
    // Update selected year when month changes
    React.useEffect(() => {
      setSelectedYear(month.getFullYear());
    }, [month]);

    return (
      <div
        ref={ref}
        className={cn(calendarVariants({ variant }), className, "calendar")}
        {...props}
      >
        {/* Date Range Display */}
        {mode === "range" && (
          <div className="px-3 pt-2 pb-4 text-sm text-gray-700 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">From</span>
              <span className="font-semibold">{formatDate(rangeFrom) || '—'}</span>
            </div>
            <div className="h-px w-4 bg-gray-300 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">To</span>
              <span className="font-semibold">{formatDate(rangeTo) || '—'}</span>
            </div>
          </div>
        )}
        
        {/* Calendar Header */}
        <div className={cn(calendarHeaderVariants({ variant }), "calendar-header relative")}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className={cn(calendarNavButtonVariants({ variant }), "calendar-nav-button")}
            aria-label="Previous month"
            tabIndex={-1} // Prevent default focus
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-1 relative">
            <button
              type="button"
              onClick={() => {
                setShowMonthSelector(!showMonthSelector);
                setShowYearSelector(false);
              }}
              className={cn(
                calendarMonthSelectVariants({ variant }), 
                "calendar-month-select px-2 py-1 rounded cursor-pointer"
              )}
              aria-label="Select month"
            >
              {month.toLocaleDateString('en-US', { month: 'long' })}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setShowYearSelector(!showYearSelector);
                setShowMonthSelector(false);
              }}
              className={cn(
                calendarMonthSelectVariants({ variant }), 
                "calendar-year-select px-2 py-1 rounded cursor-pointer"
              )}
              aria-label="Select year"
            >
              {month.getFullYear()}
            </button>
            
            {/* Month Selector Dropdown */}
            {showMonthSelector && (
              <div className={cn(
                calendarSelectorDropdownVariants({ type: "month" }),
                "month-selector-container"
              )}>
                {monthNames.map((monthName, index) => (
                  <button
                    key={monthName}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      calendarSelectorOptionVariants({
                        type: "month",
                        selected: index === month.getMonth()
                      }),
                      "calendar-selector-option"
                    )}
                  >
                    {monthName.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
            
            {/* Year Selector Dropdown */}
            {showYearSelector && (
              <div className={cn(
                "absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[160px]",
                "year-selector-container"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={handlePrevYear}
                    disabled={selectedYear <= minYear}
                    className={cn(
                      "p-1 rounded hover:bg-gray-100 transition-colors",
                      selectedYear <= minYear ? "opacity-50 cursor-not-allowed" : "text-gray-600 hover:text-gray-800"
                    )}
                    aria-label="Previous year"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <span className="text-lg font-semibold text-gray-900 min-w-[60px] text-center">
                    {selectedYear}
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleNextYear}
                    disabled={selectedYear >= maxYear}
                    className={cn(
                      "p-1 rounded hover:bg-gray-100 transition-colors",
                      selectedYear >= maxYear ? "opacity-50 cursor-not-allowed" : "text-gray-600 hover:text-gray-800"
                    )}
                    aria-label="Next year"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleYearSelect(selectedYear)}
                    className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors font-medium"
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowYearSelector(false)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleNextMonth}
            className={cn(calendarNavButtonVariants({ variant }), "calendar-nav-button")}
            aria-label="Next month"
            tabIndex={-1} // Prevent default focus
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {/* Day Names */}
        <div className={cn(calendarDayNamesVariants({ variant }), "calendar-day-names")}>
          {dayNames.map((day) => (
            <div key={day} className={cn(calendarDayNameVariants({ variant }), "calendar-day-name")}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 calendar-grid">
          {days.map((day, index) => (
            <button
              key={`${day.date.toISOString()}-${index}`}
              type="button"
              onClick={() => handleDateSelect(day.date)}
              disabled={day.isDisabled}
                className={cn(
                  calendarDayVariants({
                    variant,
                    // Apply 'selected' style if it's the single selected date OR the 'from' date when 'to' is not yet selected
                    selected: day.isSelected, 
                    // Apply range styles only when both from and to are selected
                    rangeStart: day.isRangeStart,
                    rangeEnd: day.isRangeEnd,
                    rangeMiddle: day.isInRange,
                    today: day.isToday,
                    disabled: day.isDisabled,
                    outside: day.isOutsideMonth,
                  }),
                  "calendar-day",
                  // Add specific classes for easier CSS targeting if needed, but rely on variants primarily
                  day.isSelected && "calendar-day-selected", // Covers single mode and range 'from' selection phase
                  day.isRangeStart && "calendar-day-range-start",
                  day.isRangeEnd && "calendar-day-range-end",
                  day.isInRange && "calendar-day-range-middle",
                  day.isToday && "calendar-day-today",
                  day.isDisabled && "calendar-day-disabled",
                  day.isOutsideMonth && "calendar-day-outside"
                )}
                aria-label={day.date.toLocaleDateString()}
                aria-selected={(day.isSelected || day.isRangeStart || day.isRangeEnd) ? "true" : undefined}
                tabIndex={day.isSelected || day.isRangeStart || day.isRangeEnd || (initialFocus && index === 0) ? 0 : -1}
              >
                {day.dayOfMonth}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps };
