'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FamilyResponse } from './api/types';
import { ThemeProvider } from '@/src/context/theme';
import ComingSoon from './coming-soon/page';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [deploymentMode, setDeploymentMode] = useState<string>('selfhosted');

  useEffect(() => {
    const checkDeploymentMode = async () => {
      try {
        setLoading(true);
        
        // Check deployment mode first
        const configResponse = await fetch('/api/deployment-config');
        const configData = await configResponse.json();
        
        if (configData.success && configData.data?.deploymentMode === 'saas') {
          // SaaS mode - render SaaS homepage directly
          setDeploymentMode('saas');
          setLoading(false);
          return;
        }
        
        // Self-hosted mode - continue with existing logic
        setDeploymentMode('selfhosted');
        
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
        console.error('Error checking deployment mode or families:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkDeploymentMode();
  }, [router]);

  // Return loading state while checking deployment mode
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If SaaS mode, render the SaaS homepage directly
  if (deploymentMode === 'saas') {
    return (
      <ThemeProvider>
        <ComingSoon />
      </ThemeProvider>
    );
  }
  
  // This should not render for self-hosted as useEffect will redirect
  return null;
}
