'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FamilyResponse } from './api/types';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<FamilyResponse[]>([]);

  useEffect(() => {
    const checkFamilies = async () => {
      try {
        setLoading(true);
        // Fetch families and check if setup is needed
        const [familiesResponse, caretakerExistsResponse] = await Promise.all([
          fetch('/api/family/public-list'),
          fetch('/api/auth/caretaker-exists')
        ]);
        
        const familiesData = await familiesResponse.json();
        const caretakerData = await caretakerExistsResponse.json();
        
        if (familiesData.success && Array.isArray(familiesData.data)) {
          const familiesList = familiesData.data;
          setFamilies(familiesList);
          
          // Check if setup is needed
          const hasCaretakers = caretakerData.success && caretakerData.data?.exists;
          const needsSetup = familiesList.length === 0 || 
                            (familiesList.length === 1 && familiesList[0].slug === 'my-family' && !hasCaretakers);
          
          if (needsSetup) {
            // Setup needed - redirect to login first for authentication
            router.push('/login?setup=true');
          } else if (familiesList.length === 1) {
            // If only one family exists (and setup is complete), redirect to that family
            const familySlug = familiesList[0].slug;
            
            // Check if user is already authenticated
            const authToken = localStorage.getItem('authToken');
            const unlockTime = localStorage.getItem('unlockTime');
            
            if (authToken && unlockTime) {
              // User is authenticated, redirect to main app
              router.push(`/${familySlug}/log-entry`);
            } else {
              // Not authenticated, redirect to login
              router.push(`/${familySlug}/login`);
            }
          } else {
            // Multiple families, redirect to family selection
            router.push('/family-select');
          }
        }
      } catch (error) {
        console.error('Error fetching families:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkFamilies();
  }, [router]);

  // Return loading state - the useEffect will handle redirects
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // This should not render as useEffect will redirect
  return null;
}
