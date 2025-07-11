import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/src/lib/utils"
import { useTheme } from "@/src/context/theme"

import { buttonVariants } from "./button.styles"
import { ButtonProps } from "./button.types"
import "./button.css"

/**
 * Button component with multiple variants and sizes
 *
 * This is a highly configurable UI component that follows the project's design system.
 * It's designed to be cross-platform compatible with minimal changes required for React Native.
 *
 * Features:
 * - Multiple visual variants (default, destructive, outline, etc.)
 * - Multiple size options (default, sm, lg, xl, icon)
 * - Support for all standard button HTML attributes
 * - Accessible focus states with keyboard navigation support
 * - Can render as a different element using asChild prop
 *
 * @example
 * ```tsx
 * <Button variant="success" size="lg" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const { theme } = useTheme();
    
    // Add dark mode specific classes based on variant
    const darkModeClass = variant === 'outline' ? 'button-dark-outline' : 
                          variant === 'ghost' ? 'button-dark-ghost' : 
                          variant === 'link' ? 'button-dark-link' : 
                          variant === 'secondary' ? 'button-dark-secondary' : 
                          variant === 'input' ? 'button-dark-input' : '';
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), darkModeClass)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
