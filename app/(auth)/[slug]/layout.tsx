'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ThemeProvider } from '@/src/context/theme';
import { FamilyProvider } from '@/src/context/family';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const params = useParams();
  const familySlug = params?.slug as string;

  // Early slug validation for auth routes
  useEffect(() => {
    const validateSlug = async () => {
      if (!familySlug) return; // No slug is fine for auth routes
      
      try {
        const response = await fetch(`/api/family/by-slug/${encodeURIComponent(familySlug)}`);
        const data = await response.json();
        
        // If family doesn't exist, redirect to home
        if (!data.success || !data.data) {
          console.log(`Family slug "${familySlug}" not found in auth route, redirecting to home...`);
          router.push('/');
        }
      } catch (error) {
        console.error('Error validating family slug in auth layout:', error);
        // On error, redirect to home to be safe
        router.push('/');
      }
    };

    validateSlug();
  }, [familySlug, router]);

  return (
    <ThemeProvider>
      <FamilyProvider>
        {children}
      </FamilyProvider>
    </ThemeProvider>
  );
}
