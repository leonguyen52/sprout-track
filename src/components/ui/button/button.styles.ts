import { cva } from "class-variance-authority"

/**
 * Button variant styles using class-variance-authority
 * Defines all visual variations of the button component
 *
 * This uses TailwindCSS classes for styling and follows the project's design system
 * When adapting to React Native, these styles will need to be converted to React Native StyleSheet
 * or a compatible styling solution like NativeWind
 *
 * @see https://cva.style/docs for more information on class-variance-authority
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        outline:
          "border-2 border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-teal-700",
        secondary:
          "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        ghost: 
          "hover:bg-teal-50 hover:text-teal-700",
        link: 
          "text-teal-600 underline-offset-4 hover:underline",
        success:
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        info:
          "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        warning:
          "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        timerActive:
          "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 animate-pulse",
        input:
          "flex h-10 w-full rounded-xl border-2 border-indigo-200 bg-white px-4 py-2 text-base text-gray-900 ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        custom:
          "", // Empty string to allow full customization through className
      },
      size: {
        default: "h-10 px-5 py-2 rounded-xl",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
