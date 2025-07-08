/**
 * Styles for the Accordion component (light mode)
 * 
 * These styles use TailwindCSS classes and follow the project's design system.
 * When adapting to React Native, these styles will need to be converted to React Native StyleSheet
 * or a compatible styling solution like NativeWind.
 */
export const accordionStyles = {
  // Root accordion container
  root: "w-full",
  
  // Individual accordion item
  item: "border-b border-gray-200",
  
  // Trigger button that expands/collapses content
  trigger: "flex w-full items-center justify-between py-4 text-left font-medium text-gray-900 transition-all hover:text-teal-600 [&[data-state=open]>svg]:rotate-180",
  
  // Icon for the trigger
  icon: "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
  iconExpanded: "rotate-180",
  
  // Content container
  content: "overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
  contentClosed: "h-0",
  
  // Inner content wrapper
  contentInner: "pb-4 pt-0",
};
