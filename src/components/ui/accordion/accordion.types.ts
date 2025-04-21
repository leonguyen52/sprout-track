/**
 * Props for the Accordion component
 */
export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Type of accordion - whether multiple items can be expanded simultaneously
   * @default "single"
   */
  type?: "single" | "multiple";
  
  /**
   * The controlled value(s) of the expanded accordion item(s)
   */
  value?: string | string[];
  
  /**
   * The default value(s) of the expanded accordion item(s)
   */
  defaultValue?: string | string[];
  
  /**
   * Callback function when the expanded state changes
   */
  onValueChange?: (value: string | string[]) => void;
  
  /**
   * Whether the expanded item can be collapsed
   * @default false
   */
  collapsible?: boolean;
}

/**
 * Props for the AccordionItem component
 */
export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Unique value for the accordion item
   */
  value: string;
}

/**
 * Props for the AccordionTrigger component
 */
export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Props for the AccordionContent component
 */
export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}
