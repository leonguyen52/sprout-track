/**
 * Props for the Switch component
 */
export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Whether the switch is checked
   */
  checked?: boolean;
  
  /**
   * Callback function when the checked state changes
   */
  onCheckedChange?: (checked: boolean) => void;
  
  /**
   * Whether the switch is disabled
   */
  disabled?: boolean;
  
  /**
   * Color variant for the switch
   */
  variant?: 'default' | 'green';
}
