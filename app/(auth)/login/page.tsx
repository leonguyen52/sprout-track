'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginSecurity from '@/src/components/LoginSecurity';
import { useTheme } from '@/src/context/theme';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { FamilyResponse } from '@/app/api/types';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if this is a setup flow
  const setupType = searchParams.get('setup');
  const setupToken = searchParams.get('token');
  const isSetupFlow = setupType === 'true';
  const isTokenSetupFlow = setupType === 'token' && setupToken;

  // Load families for the dropdown
  useEffect(() => {
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/family/public-list');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setFamilies(data.data);
            
            // If only one family exists, auto-select it
            if (data.data.length === 1) {
              setSelectedFamily(data.data[0].slug);
            }
          }
        }
      } catch (error) {
        console.error('Error loading families:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, []);

  // Handle successful authentication
  const handleUnlock = (caretakerId?: string) => {
    if (isTokenSetupFlow) {
      // Token-based setup flow
      router.push(`/setup/${setupToken}`);
    } else if (isSetupFlow) {
      // Regular setup flow - always go to /setup regardless of family context
      router.push('/setup');
    } else {
      // Normal login - redirect to main app
      if (selectedFamily) {
        router.push(`/${selectedFamily}/log-entry`);
      } else {
        router.push('/log-entry');
      }
    }
  };

  // Check if already authenticated on page load
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const unlockTime = localStorage.getItem('unlockTime');
    
    // If user is authenticated, redirect appropriately
    if (authToken && unlockTime) {
      if (isTokenSetupFlow) {
        // Token-based setup flow
        router.push(`/setup/${setupToken}`);
      } else if (isSetupFlow) {
        // Regular setup flow - always go to /setup regardless of family context
        router.push('/setup');
      } else {
        // Normal flow - redirect to main app
        if (selectedFamily) {
          router.push(`/${selectedFamily}/log-entry`);
        } else {
          router.push('/log-entry');
        }
      }
    }
  }, [router, selectedFamily, isSetupFlow, isTokenSetupFlow, setupToken]);

  // Handle family selection change
  const handleFamilyChange = (value: string) => {
    setSelectedFamily(value);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Show setup message if this is setup flow */}
      {(isSetupFlow || isTokenSetupFlow) && (
        <div className="w-full max-w-md mx-auto mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            {isTokenSetupFlow ? 'Invitation Setup' : 'Initial Setup Required'}
          </h2>
          <p className="text-blue-700">
            {isTokenSetupFlow 
              ? 'Please authenticate to complete the invited family setup.'
              : 'Please authenticate with the system PIN to complete the initial setup.'
            }
          </p>
        </div>
      )}
      
      {/* Only show family selector if not setup flow and multiple families exist */}
      {!isSetupFlow && !isTokenSetupFlow && families.length > 1 && (
        <div className="w-full max-w-md mx-auto mb-4 p-4">
          <label className="block text-sm font-medium mb-2">Select Family</label>
          <Select
            value={selectedFamily || ''}
            onValueChange={handleFamilyChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a family" />
            </SelectTrigger>
            <SelectContent>
              {families.map((f) => (
                <SelectItem key={f.id} value={f.slug}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <LoginSecurity 
        onUnlock={handleUnlock} 
        familySlug={(isSetupFlow || isTokenSetupFlow) ? undefined : selectedFamily || undefined}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
