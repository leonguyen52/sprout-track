'use client';

import { useEffect } from 'react';
import { useFamily } from '@/src/context/family';
import { usePathname } from 'next/navigation';

interface DynamicTitleProps {
  baseTitle?: string;
}

/**
 * Component that dynamically updates the document title based on family context
 * Only updates the title when inside the family app routes (app/(app)/[slug]/)
 */
export function DynamicTitle({ baseTitle = 'Sprout Track' }: DynamicTitleProps) {
  const { family } = useFamily();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're in a family app route pattern: /[slug]/...
    // Exclude only /home route, but include /demo as it's a valid family
    const isInFamilyApp = pathname && /^\/[^\/]+\/?/.test(pathname) && !pathname.startsWith('/home');
    
    console.log('DynamicTitle Debug:', {
      pathname,
      isInFamilyApp,
      familyName: family?.name,
      currentTitle: document.title
    });
    
    // Use setTimeout to ensure this runs after any other title updates
    const updateTitle = () => {
      if (isInFamilyApp && family?.name) {
        // Update title to include family name
        document.title = `${baseTitle} - ${family.name}`;
        console.log('Updated title to:', document.title);
      } else {
        // Reset to base title
        document.title = baseTitle;
        console.log('Reset title to:', document.title);
      }
    };
    
    // Run immediately
    updateTitle();
    
    // Also run after a small delay to override any competing title updates
    const timeoutId = setTimeout(updateTitle, 100);
    
    return () => clearTimeout(timeoutId);
  }, [family?.name, pathname, baseTitle]);

  // This component doesn't render anything
  return null;
}