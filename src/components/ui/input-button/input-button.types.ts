import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { inputButtonVariants } from "./input-button.styles"

/**
 * Layout options for the InputButton component
 */
export type InputButtonLayout = "left" | "right" | "below"

/**
 * Props for the InputButton component
 */
export interface InputButtonProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputButtonVariants> {
  /**
   * Layout position of the button relative to the input
   * @default "right"
   */
  layout?: InputButtonLayout
  
  /**
   * Button text content
   */
  buttonText: string
  
  /**
   * Button click handler
   */
  onButtonClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  
  /**
   * Button variant (inherits from button component)
   * @default "default"
   */
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "info" | "warning"
  
  /**
   * Button size
   * @default "default"
   */
  buttonSize?: "default" | "sm" | "lg" | "xl" | "icon"
  
  /**
   * Additional CSS classes for the input
   */
  inputClassName?: string
  
  /**
   * Additional CSS classes for the button
   */
  buttonClassName?: string
  
  /**
   * Additional CSS classes for the container
   */
  containerClassName?: string
  
  /**
   * Whether the button is disabled
   */
  buttonDisabled?: boolean
  
  /**
   * Whether the button is loading
   */
  buttonLoading?: boolean
  
  /**
   * Error message to display
   */
  error?: string
}
