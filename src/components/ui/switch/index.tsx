import * as React from "react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { switchStyles } from "./switch.styles";
import { SwitchProps } from "./switch.types";
import "./switch.css";

/**
 * Switch component for toggling between states
 *
 * A toggle switch component that follows the project's design system.
 * It's designed to be cross-platform compatible with minimal changes required for React Native.
 *
 * Features:
 * - Accessible keyboard navigation
 * - Visual feedback for checked/unchecked states
 * - Follows the project's design system
 * - Support for disabled state
 *
 * @example
 * ```tsx
 * <Switch
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 *   aria-label="Toggle feature"
 * />
 * ```
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, variant = 'default', ...props }, ref) => {
    const { theme } = useTheme();
    
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };
    
    // Determine background color based on variant and checked state
    const getBackgroundStyle = () => {
      if (variant === 'green') {
        return checked ? switchStyles.greenChecked : switchStyles.greenUnchecked;
      }
      return checked ? switchStyles.checked : switchStyles.unchecked;
    };
    
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        ref={ref}
        className={cn(
          switchStyles.base,
          getBackgroundStyle(),
          disabled && switchStyles.disabled,
          className,
          theme === 'dark' && "switch-dark"
        )}
        {...props}
      >
        <span 
          className={cn(
            switchStyles.thumb,
            checked ? switchStyles.thumbChecked : switchStyles.thumbUnchecked,
            theme === 'dark' && "switch-thumb-dark"
          )} 
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
