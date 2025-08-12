import { type VariantProps } from "class-variance-authority"
import { calendarVariants } from "./calendar.styles"

/**
 * Props for the Calendar component
 *
 * @extends VariantProps<typeof calendarVariants> - Includes variant props from calendarVariants
 */
export interface CalendarProps extends VariantProps<typeof calendarVariants> {
  /**
   * The selected date (for single date selection)
   */
  selected?: Date | null | undefined
  
  /**
   * Callback function when a date is selected (for single date selection)
   */
  onSelect?: (date: Date) => void
  
  /**
   * The selected date range start (for range selection)
   */
  rangeFrom?: Date | null | undefined
  
  /**
   * The selected date range end (for range selection)
   */
  rangeTo?: Date | null | undefined
  
  /**
   * Callback function when a date range is selected
   */
  onRangeChange?: (from: Date | null, to: Date | null) => void
  
  /**
   * Whether to use date range selection mode
   */
  mode?: "single" | "range"
  
  /**
   * The month to display
   * Defaults to current month if not provided
   */
  month?: Date
  
  /**
   * Optional class name for additional styling
   */
  className?: string
  
  /**
   * Optional minimum selectable date
   */
  minDate?: Date
  
  /**
   * Optional maximum selectable date
   */
  maxDate?: Date
  
  /**
   * Optional array of dates to disable
   */
  disabledDates?: Date[]
  
  /**
   * Optional function to determine if a date should be disabled
   */
  isDateDisabled?: (date: Date) => boolean
  
  /**
   * Optional initial focus date when calendar opens
   */
  initialFocus?: boolean
}

/**
 * Calendar page types for navigation
 */
export type CalendarPage = 'dates' | 'months' | 'years';

/**
 * Internal calendar state
 */
export interface CalendarState {
  currentPage: CalendarPage;
  displayMonth: Date;
}
