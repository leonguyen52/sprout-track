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
            // No families - will show setup needed message in UI
            // TODO: Redirect to setup wizard when implemented
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

  // Return loading state or no families message
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If no families found, show setup needed message
  if (families.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Setup Required</h2>
          <p className="text-gray-600 mb-4">No families found. Setup wizard coming soon!</p>
          <div className="animate-pulse text-gray-400">Please contact administrator</div>
        </div>
      </div>
    );
  }
  
  return null;
}
