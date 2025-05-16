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
  const { family, setFamily } = useFamily();
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const familySlug = params?.slug as string;

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
            
            // If we have a slug in the URL, find the matching family
            if (familySlug) {
              const matchingFamily = data.data.find((f: FamilyResponse) => f.slug === familySlug);
              if (matchingFamily) {
                setFamily(matchingFamily);
              }
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
  }, [familySlug, setFamily]);

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
  }, [router, familySlug]);

  // Handle family selection change
  const handleFamilyChange = (value: string) => {
    const selectedFamily = families.find(f => f.slug === value);
    if (selectedFamily) {
      router.push(`/${selectedFamily.slug}/login`);
    }
  };

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
      
      <LoginSecurity onUnlock={handleUnlock} />
    </div>
  );
}
