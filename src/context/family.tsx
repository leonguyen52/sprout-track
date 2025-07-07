'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Family {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface FamilyContextType {
  family: Family | null;
  loading: boolean;
  error: string | null;
  setFamily: (family: Family) => void;
  families: Family[];
  loadFamilies: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<Family | null>(() => {
    // Try to get from localStorage first for persistence
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedFamily');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Extract family slug from URL
  const getFamilySlugFromUrl = () => {
    if (!pathname) return null;
    const segments = pathname.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  };

  // Persist selected family
  useEffect(() => {
    if (family) {
      localStorage.setItem('selectedFamily', JSON.stringify(family));
    }
  }, [family]);

  // Load family data based on slug in URL or system admin context
  useEffect(() => {
    const loadFamilyFromUrl = async () => {
      const slug = getFamilySlugFromUrl();
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is a system administrator
        const authToken = localStorage.getItem('authToken');
        let isSysAdmin = false;
        
        if (authToken) {
          try {
            const payload = authToken.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            isSysAdmin = decodedPayload.isSysAdmin || false;
          } catch (error) {
            console.error('Error parsing JWT token in family context:', error);
          }
        }

        // For system administrators, we need to load family by slug since they don't have a fixed familyId
        // For regular users, this also works as expected
        const response = await fetch(`/api/family/by-slug/${slug}`, {
          headers: authToken ? {
            'Authorization': `Bearer ${authToken}`
          } : {}
        });
        
        if (!response.ok) {
          throw new Error('Failed to load family data');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setFamily(data.data);
          
          // For system administrators, store the family context so APIs can use it
          if (isSysAdmin && typeof window !== 'undefined') {
            // Store the current family context for the session
            sessionStorage.setItem('sysadmin-family-context', JSON.stringify(data.data));
          }
        } else {
          setError(data.error || 'Failed to load family data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadFamilyFromUrl();
  }, [pathname]);

  // Load all available families
  const loadFamilies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/family/list');
      if (!response.ok) {
        throw new Error('Failed to load families');
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setFamilies(data.data);
      } else {
        setError(data.error || 'Failed to load families');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    family,
    loading,
    error,
    setFamily,
    families,
    loadFamilies
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
