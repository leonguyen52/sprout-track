import { cva } from "class-variance-authority";

/**
 * Badge variant styles using class-variance-authority
 * Defines all visual variations of the badge component
 *
 * This uses TailwindCSS classes for styling and follows the project's design system
 * When adapting to React Native, these styles will need to be converted to React Native StyleSheet
 * or a compatible styling solution like NativeWind
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-teal-100 text-teal-800",
        secondary:
          "bg-gray-100 text-gray-800",
        outline:
          "border border-gray-200 text-gray-700",
        success:
          "bg-green-100 text-green-800",
        warning:
          "bg-amber-100 text-amber-800",
        error:
          "bg-red-100 text-red-800",
        info:
          "bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
