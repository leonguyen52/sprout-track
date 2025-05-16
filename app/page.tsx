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
        // Fetch families without authentication
        const response = await fetch('/api/family/public-list');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setFamilies(data.data);
          
          // If only one family exists, redirect to that family
          if (data.data.length === 1) {
            const familySlug = data.data[0].slug;
            
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
          } else if (data.data.length > 1) {
            // Multiple families, redirect to family selection
            router.push('/family-select');
          } else {
            // No families, redirect to setup
            router.push('/setup');
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

  // Return loading state or null as this is just a redirect page
  return loading ? <div className="flex items-center justify-center h-screen">Loading...</div> : null;
}
