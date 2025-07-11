import { cva } from "class-variance-authority";

/**
 * No Baby Selected component styles using class-variance-authority
 * Defines all visual variations of the no baby selected component
 *
 * This uses TailwindCSS classes for styling and follows the project's design system
 */
export const noBabySelectedStyles = {
  // Main container
  container: "flex flex-col items-center justify-center min-h-screen h-full w-full text-center py-12 px-6 bg-white transition-colors duration-200",
  
  // Icon container
  iconContainer: "w-16 h-16 mx-auto mb-6 rounded-full bg-teal-100 flex items-center justify-center transition-colors duration-200",
  
  // Icon styling
  icon: "h-8 w-8 text-teal-600 transition-colors duration-200",
  
  // Text container
  textContainer: "flex flex-col items-center space-y-2",
  
  // Title styling
  title: "text-2xl font-semibold text-gray-900 transition-colors duration-200",
  
  // Description styling
  description: "text-gray-500 transition-colors duration-200 max-w-md",
}; 