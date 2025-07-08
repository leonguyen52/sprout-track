'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoginSecurity from '@/src/components/LoginSecurity';
import { useTheme } from '@/src/context/theme';
import { useFamily } from '@/src/context/family';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { FamilyResponse } from '@/app/api/types';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const { family, loading: familyLoading } = useFamily();
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [slugValidated, setSlugValidated] = useState(false);
  const familySlug = params?.slug as string;

  // Validate family slug exists first
  useEffect(() => {
    const validateSlug = async () => {
      if (!familySlug) {
        setSlugValidated(true);
        return;
      }

      try {
        const response = await fetch(`/api/family/by-slug/${encodeURIComponent(familySlug)}`);
        const data = await response.json();
        
        // If family doesn't exist, redirect to home
        if (!data.success || !data.data) {
          console.log(`Family slug "${familySlug}" not found during login, redirecting to home...`);
          router.push('/');
          return;
        }
        
        // Family exists, allow login page to continue loading
        setSlugValidated(true);
      } catch (error) {
        console.error('Error validating family slug during login:', error);
        // On error, redirect to home to be safe
        router.push('/');
      }
    };

    validateSlug();
  }, [familySlug, router]);

  // Load families for the dropdown only
  useEffect(() => {
    // Don't load families until slug is validated
    if (!slugValidated) return;
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/family/public-list');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setFamilies(data.data);
          }
        }
      } catch (error) {
        console.error('Error loading families:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, [slugValidated]);

  // Handle successful authentication
  const handleUnlock = (caretakerId?: string) => {
    // Redirect to main app after successful authentication
    if (familySlug) {
      router.push(`/${familySlug}/log-entry`);
    } else {
      router.push('/log-entry');
    }
  };

  // Check if already authenticated on page load
  useEffect(() => {
    // Don't check auth until slug is validated
    if (!slugValidated) return;
    
    const authToken = localStorage.getItem('authToken');
    const unlockTime = localStorage.getItem('unlockTime');
    
    // If user is authenticated, redirect to main app
    // The app layout will handle checking for session expiration
    if (authToken && unlockTime) {
      if (familySlug) {
        router.push(`/${familySlug}/log-entry`);
      } else {
        router.push('/log-entry');
      }
    }
  }, [router, familySlug, slugValidated]);

  // Check if family is inactive and redirect to root
  useEffect(() => {
    // Only check after slug is validated and family context has finished loading
    if (!slugValidated || familyLoading) return;
    
    if (family && family.isActive === false) {
      // Family exists but is inactive - redirect to root
      router.push('/');
    } else if (!family && familySlug) {
      // Family not found for the given slug - redirect to root
      router.push('/');
    }
  }, [family, familyLoading, familySlug, router, slugValidated]);

  // Handle family selection change
  const handleFamilyChange = (value: string) => {
    const selectedFamily = families.find(f => f.slug === value);
    if (selectedFamily) {
      router.push(`/${selectedFamily.slug}/login`);
    }
  };

  // Show loading while validating slug
  if (!slugValidated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Validating family...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {families.length > 1 && (
        <div className="w-full max-w-md mx-auto mb-4 p-4">
          <label className="block text-sm font-medium mb-2">Select Family</label>
          <Select
            value={familySlug || ''}
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
        familySlug={familySlug} 
        familyName={!familyLoading && family ? family.name : undefined} 
      />
    </div>
  );
}
