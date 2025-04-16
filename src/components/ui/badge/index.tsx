import * as React from "react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { badgeVariants } from "./badge.styles";
import { BadgeProps } from "./badge.types";
import "./badge.css";

/**
 * Badge component for displaying short status descriptors
 *
 * A small visual indicator component that follows the project's design system.
 * It's designed to be cross-platform compatible with minimal changes required for React Native.
 *
 * Features:
 * - Multiple visual variants (default, outline, secondary)
 * - Compact design for displaying status, counts, or labels
 * - Follows the project's design system
 *
 * @example
 * ```tsx
 * <Badge variant="outline">New</Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    const { theme } = useTheme();
    
    // Add dark mode specific classes based on variant
    const darkModeClass = variant === 'outline' ? 'badge-dark-outline' : 
                          variant === 'secondary' ? 'badge-dark-secondary' : 
                          'badge-dark-default';
    
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className, darkModeClass)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
