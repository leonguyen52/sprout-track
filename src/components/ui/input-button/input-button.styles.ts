import { cva } from "class-variance-authority"

/**
 * InputButton variant styles using class-variance-authority
 * Combines input and button styling patterns from the existing components
 */
export const inputButtonVariants = cva(
  "relative flex items-center",
  {
    variants: {
      layout: {
        left: "flex-row",
        right: "flex-row",
        below: "flex-col space-y-2",
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        xl: "",
      },
    },
    defaultVariants: {
      layout: "right",
      size: "default",
    },
  }
)

/**
 * Input styles for the InputButton component
 * Based on the existing input component styles
 */
export const inputButtonInputStyles = {
  base: "flex h-10 w-full rounded-xl border-2 border-indigo-200 bg-white px-4 py-2 text-base text-gray-900 ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  left: "rounded-r-none border-r-0 focus:border-r-0 focus:ring-0",
  right: "rounded-l-none border-l-0 focus:border-l-0 focus:ring-0",
  below: "rounded-xl",
  error: "border-red-300 focus:border-red-400 focus:ring-red-100",
}

/**
 * Button styles for the InputButton component
 * Based on the existing button component styles
 */
export const inputButtonButtonStyles = {
  base: "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 border-2",
  left: "rounded-l-xl rounded-r-none border-indigo-200 border-r-0",
  right: "rounded-r-xl rounded-l-none border-indigo-200 border-l-0",
  below: "rounded-xl w-full border-indigo-200",
  variants: {
    default: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-teal-600",
    destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-red-600",
    outline: "border-2 border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-teal-700",
    secondary: "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-slate-700",
    ghost: "hover:bg-teal-50 hover:text-teal-700 border-transparent",
    link: "text-teal-600 underline-offset-4 hover:underline border-transparent",
    success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-emerald-500",
    info: "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-sky-500",
    warning: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-amber-500",
  },
  sizes: {
    default: "h-10 px-5 py-2",
    sm: "h-9 px-4 text-xs",
    lg: "h-12 px-8 text-base",
    xl: "h-14 px-10 text-lg",
    icon: "h-10 w-10",
  },
}

/**
 * Container styles for different layouts
 */
export const inputButtonContainerStyles = {
  left: "flex flex-row items-center",
  right: "flex flex-row items-center",
  below: "flex flex-col space-y-2",
}

/**
 * Error message styles
 */
export const inputButtonErrorStyles = "text-sm text-red-600 mt-1"
