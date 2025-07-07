import { cva } from "class-variance-authority"

/**
 * ShareButton variant styles using class-variance-authority
 * Defines all visual variations of the share button component
 *
 * This uses TailwindCSS classes for styling and follows the project's design system
 * Colors and patterns match the main Button component for consistency
 *
 * @see https://cva.style/docs for more information on class-variance-authority
 */
export const shareButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        outline:
          "border-2 border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-teal-700",
        ghost: 
          "hover:bg-teal-50 hover:text-teal-700 text-teal-600",
        link: 
          "text-teal-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-xl",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
      state: {
        normal: "",
        copied: "text-emerald-600 dark:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "sm",
      state: "normal",
    },
  }
) 