'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Baby } from '@prisma/client';

interface BabyContextType {
  selectedBaby: Baby | null;
  setSelectedBaby: (baby: Baby | null) => void;
  sleepingBabies: Set<string>;
  setSleepingBabies: (babies: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

const BabyContext = createContext<BabyContextType>({
  selectedBaby: null,
  setSelectedBaby: () => {},
  sleepingBabies: new Set(),
  setSleepingBabies: () => {},
});

interface BabyProviderProps {
  children: React.ReactNode;
}

export function BabyProvider({ children }: BabyProviderProps) {
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [sleepingBabies, setSleepingBabies] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sleepingBabies');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [currentFamily, setCurrentFamily] = useState<{id: string, slug: string} | null>(null);

  // Helper function to get current family from URL or localStorage
  const getCurrentFamily = (): {id: string, slug: string} | null => {
    if (typeof window === 'undefined') return null;
    
    // Try to get family from URL first
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const familySlug = segments.length > 0 ? segments[0] : null;
    
    if (familySlug) {
      // Try to get family info from localStorage (set by FamilyProvider)
      const savedFamily = localStorage.getItem('selectedFamily');
      if (savedFamily) {
        try {
          const family = JSON.parse(savedFamily);
          if (family.slug === familySlug) {
            return { id: family.id, slug: family.slug };
          }
        } catch (e) {
          console.error('Error parsing saved family:', e);
        }
      }
    }
    
    return null;
  };

  // Helper function to get family-specific localStorage key
  const getFamilySpecificKey = (baseKey: string, familyId?: string): string => {
    if (familyId) {
      return `${baseKey}_${familyId}`;
    }
    return baseKey;
  };

  // Load family-specific baby selection from localStorage
  useEffect(() => {
    const family = getCurrentFamily();
    
    // If family changed, clear current selection and load family-specific data
    if (family && (!currentFamily || currentFamily.id !== family.id)) {
      setCurrentFamily(family);
      
      // Load family-specific selected baby
      const familyBabyKey = getFamilySpecificKey('selectedBaby', family.id);
      const saved = localStorage.getItem(familyBabyKey);
      
      if (saved) {
        try {
          const baby = JSON.parse(saved);
          // Validate that the baby belongs to the current family
          if (baby.familyId === family.id) {
            setSelectedBaby(baby);
          } else {
            // Baby doesn't belong to current family, clear selection
            setSelectedBaby(null);
            localStorage.removeItem(familyBabyKey);
          }
        } catch (e) {
          console.error('Error parsing saved baby:', e);
          setSelectedBaby(null);
        }
      } else {
        setSelectedBaby(null);
      }
      
      // Load family-specific sleeping babies
      const familySleepingKey = getFamilySpecificKey('sleepingBabies', family.id);
      const savedSleeping = localStorage.getItem(familySleepingKey);
      if (savedSleeping) {
        try {
          setSleepingBabies(new Set(JSON.parse(savedSleeping)));
        } catch (e) {
          console.error('Error parsing saved sleeping babies:', e);
          setSleepingBabies(new Set());
        }
      } else {
        setSleepingBabies(new Set());
      }
    } else if (!family && currentFamily) {
      // No family context, clear everything
      setCurrentFamily(null);
      setSelectedBaby(null);
      setSleepingBabies(new Set());
    }
  }, [currentFamily]);

  // Monitor for family changes via URL changes
  useEffect(() => {
    const handlePopState = () => {
      const family = getCurrentFamily();
      if (family && (!currentFamily || currentFamily.id !== family.id)) {
        // Trigger re-evaluation in next effect
        setCurrentFamily(family);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentFamily]);

  // Persist selected baby (family-specific)
  useEffect(() => {
    if (currentFamily?.id) {
      const familyBabyKey = getFamilySpecificKey('selectedBaby', currentFamily.id);
      
      if (selectedBaby) {
        // Only persist if baby belongs to current family
        if (selectedBaby.familyId === currentFamily.id) {
          localStorage.setItem(familyBabyKey, JSON.stringify(selectedBaby));
        }
      } else {
        localStorage.removeItem(familyBabyKey);
      }
    }
  }, [selectedBaby, currentFamily]);

  // Persist sleeping babies (family-specific)
  useEffect(() => {
    if (currentFamily?.id) {
      const familySleepingKey = getFamilySpecificKey('sleepingBabies', currentFamily.id);
      localStorage.setItem(familySleepingKey, JSON.stringify(Array.from(sleepingBabies)));
    }
  }, [sleepingBabies, currentFamily]);

  // Update URL when selected baby changes
  useEffect(() => {
    if (selectedBaby) {
      const url = new URL(window.location.href);
      url.searchParams.set('babyId', selectedBaby.id);
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedBaby]);

  // Enhanced setSelectedBaby function that validates family membership
  const setSelectedBabyWithValidation = (baby: Baby | null) => {
    if (baby && currentFamily?.id && baby.familyId !== currentFamily.id) {
      // Baby doesn't belong to current family, don't select it
      console.warn('Attempted to select baby from different family:', baby.familyId, 'vs', currentFamily.id);
      return;
    }
    setSelectedBaby(baby);
  };

  return (
    <BabyContext.Provider value={{ 
      selectedBaby, 
      setSelectedBaby: setSelectedBabyWithValidation, 
      sleepingBabies, 
      setSleepingBabies 
    }}>
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBaby must be used within a BabyProvider');
  }
  return context;
}
