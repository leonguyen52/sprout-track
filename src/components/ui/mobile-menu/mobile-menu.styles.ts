import { cva } from "class-variance-authority"

/**
 * Mobile menu variant styles using class-variance-authority
 * Defines the styling for the mobile menu component
 *
 * This uses TailwindCSS classes for styling and follows the project's design system
 * When adapting to React Native, these styles will need to be converted to React Native StyleSheet
 * or a compatible styling solution like NativeWind
 *
 * @see https://cva.style/docs for more information on class-variance-authority
 */
export const mobileMenuVariants = cva(
  "mobile-menu-container",
  {
    variants: {
      // Currently no variants, but structure is ready for future expansion
    },
    defaultVariants: {},
  }
)

/**
 * Desktop navigation container styles
 */
export const desktopNavVariants = cva(
  "hidden md:flex md:items-center md:gap-4"
)
