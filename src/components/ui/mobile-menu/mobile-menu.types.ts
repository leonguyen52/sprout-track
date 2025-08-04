import * as React from "react"

/**
 * Props for the MobileMenu component
 *
 * @extends React.HTMLAttributes<HTMLDivElement> - Includes all standard div HTML attributes
 */
export interface MobileMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The navigation items to display in both desktop and mobile views
   * These will be shown horizontally on desktop and vertically in the mobile menu panel
   */
  children: React.ReactNode

  /**
   * Additional CSS classes to apply to the container
   * @default ""
   */
  className?: string
}
