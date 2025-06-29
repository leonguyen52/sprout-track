'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/src/context/theme';

// TODO: Setup wizard implementation needed for future
// This page will handle initial family setup and onboarding
// Currently redirecting to home until implementation is complete

/* 
FUTURE IMPLEMENTATION NOTES:
- Implement full setup wizard flow
- Handle family creation and initial configuration
- Support caretaker and baby setup
- Integrate with multi-family architecture

Original logic (commented out for future reference):

import SetupWizard from '@/src/components/SetupWizard';

export default function SetupPage() {
  const router = useRouter();

  const handleSetupComplete = (family: { id: string; name: string; slug: string }) => {
    router.push(`/${family.slug}/login`);
  };

  const handleCaretakerCreate = () => {
    console.log('Caretaker creation will be handled in a later step.');
  };

  const handleBabyCreate = () => {
    console.log('Baby creation will be handled in a later step.');
  };
  
  return (
    <ThemeProvider>
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SetupWizard
        onComplete={handleSetupComplete}
        onCaretakerCreate={handleCaretakerCreate}
        onBabyCreate={handleBabyCreate}
      />
    </div>
    </ThemeProvider>
  );
}
*/

export default function SetupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home - setup wizard not implemented yet
    router.push('/');
  }, [router]);
  
  return (
    <ThemeProvider>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Setup wizard coming soon...</p>
        </div>
      </div>
    </ThemeProvider>
  );
} 