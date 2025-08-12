import { cva } from "class-variance-authority"

/**
 * Calendar variant styles using class-variance-authority
 * Defines all visual variations of the calendar component
 *
 * This uses TailwindCSS classes for styling and follows the project's design system
 * When adapting to React Native, these styles will need to be converted to React Native StyleSheet
 * or a compatible styling solution like NativeWind
 *
 * @see https://cva.style/docs for more information on class-variance-authority
 */
export const calendarVariants = cva(
  "py-3 bg-white",
  {
    variants: {
      variant: {
        default: "rounded-lg shadow-lg border border-gray-200",
        compact: "p-2 text-sm rounded-lg shadow-lg border border-gray-200",
        "date-time-picker": "h-[360px] pt-6 pb-6 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Calendar header styles
 */
export const calendarHeaderVariants = cva(
  "flex items-center justify-between mb-2",
  {
    variants: {
      variant: {
        default: "px-1",
        compact: "px-0.5",
        "date-time-picker": "px-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Calendar navigation button styles
 */
export const calendarNavButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors",
  {
    variants: {
      variant: {
        default: "p-2",
        compact: "p-1",
        "date-time-picker": "p-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Calendar month select styles
 */
export const calendarMonthSelectVariants = cva(
  "font-semibold text-gray-900 hover:bg-gray-100 transition-colors",
  {
    variants: {
      variant: {
        default: "text-base",
        compact: "text-sm",
        "date-time-picker": "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Legacy dropdown styles - kept for backwards compatibility
 * These are no longer used in the page-based navigation system
 */
export const calendarSelectorDropdownVariants = cva(
  "absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2",
  {
    variants: {
      type: {
        month: "left-[-50px] grid grid-cols-3 gap-1 min-w-[240px] z-[99999] overflow-visible",
        year: "right-0 max-h-64 overflow-y-auto min-w-[120px] z-[99999]",
      },
    },
    defaultVariants: {
      type: "month",
    },
  }
)

/**
 * Legacy selector option styles - kept for backwards compatibility
 * These are no longer used in the page-based navigation system
 */
export const calendarSelectorOptionVariants = cva(
  "text-sm rounded hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer",
  {
    variants: {
      type: {
        month: "px-3 py-2",
        year: "block w-full px-3 py-2 text-left",
      },
      selected: {
        true: "bg-teal-100 text-teal-800 font-medium",
        false: "text-gray-700",
      },
    },
    defaultVariants: {
      type: "month",
      selected: false,
    },
  }
)

/**
 * Page-based selector header styles
 */
export const calendarPageHeaderVariants = cva(
  "flex items-center justify-between p-4 border-b border-gray-200",
  {
    variants: {
      variant: {
        default: "",
        compact: "p-3",
        "date-time-picker": "p-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Calendar day styles
 */
export const calendarDayVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "h-9 w-9",
        compact: "h-7 w-7 text-xs",
        "date-time-picker": "h-10 w-9",
      },
      selected: {
        true: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 rounded-md",
        false: "hover:bg-teal-50 hover:text-teal-700 rounded-md",
      },
      rangeStart: {
        true: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 rounded-l-md rounded-r-none",
        false: "",
      },
      rangeEnd: {
        true: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 rounded-r-md rounded-l-none",
        false: "",
      },
      rangeMiddle: {
        true: "bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-none",
        false: "",
      },
      today: {
        true: "border-2 border-teal-500 font-bold",
        false: "",
      },
      disabled: {
        true: "text-gray-300 hover:bg-transparent hover:text-gray-300 cursor-not-allowed",
        false: "",
      },
      outside: {
        true: "text-gray-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      selected: false,
      today: false,
      disabled: false,
      outside: false,
    },
    compoundVariants: [
      {
        selected: true,
        today: true,
        className: "border-white",
      },
    ],
  }
)

/**
 * Calendar day names styles
 */
export const calendarDayNamesVariants = cva(
  "grid grid-cols-7 gap-0 mb-1",
  {
    variants: {
      variant: {
        default: "text-xs",
        compact: "text-xs",
        "date-time-picker": "text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Calendar day name styles
 */
export const calendarDayNameVariants = cva(
  "text-center font-medium text-gray-500",
  {
    variants: {
      variant: {
        default: "py-1",
        compact: "py-0.5",
        "date-time-picker": "py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
