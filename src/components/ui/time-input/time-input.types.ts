import * as React from "react"

export interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Error message to display when the input value is invalid
   */
  errorMessage?: string;
  
  /**
   * Whether to show validation state
   */
  showValidation?: boolean;
}
