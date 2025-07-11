import { ReactNode } from 'react';

/**
 * Props for the NoBabySelected component
 */
export interface NoBabySelectedProps {
  /**
   * The title text to display
   */
  title?: string;
  
  /**
   * The description text to display below the title
   */
  description?: string;
  
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
} 