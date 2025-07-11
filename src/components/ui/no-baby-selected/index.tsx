import React from 'react';
import { Baby } from 'lucide-react';
import { Label } from '@/src/components/ui/label';
import { useTheme } from '@/src/context/theme';
import { cn } from '@/src/lib/utils';
import { noBabySelectedStyles } from './no-baby-selected.styles';
import { NoBabySelectedProps } from './no-baby-selected.types';
import './no-baby-selected.css';

/**
 * NoBabySelected component
 * 
 * A reusable component that displays a message when no baby is selected.
 * Includes an icon, title, and description with proper light/dark mode support.
 */
export const NoBabySelected: React.FC<NoBabySelectedProps> = ({
  title = "No Baby Selected",
  description = "Please select a baby from the dropdown menu above.",
  className,
}) => {
  const { theme } = useTheme();

  return (
    <div className={cn(noBabySelectedStyles.container, className, "no-baby-selected-container")}>
      <div className={cn(noBabySelectedStyles.iconContainer, "no-baby-selected-icon-container")}>
        <Baby className={cn(noBabySelectedStyles.icon, "no-baby-selected-icon")} />
      </div>
      
      <div className={noBabySelectedStyles.textContainer}>
        <Label className={cn(noBabySelectedStyles.title, "no-baby-selected-title")}>
          {title}
        </Label>
        <Label className={cn(noBabySelectedStyles.description, "no-baby-selected-description")}>
          {description}
        </Label>
      </div>
    </div>
  );
};

export default NoBabySelected; 