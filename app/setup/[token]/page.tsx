'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// TODO: Setup wizard implementation needed for future
// This page will handle family setup with invitation tokens
// Currently redirecting to home until implementation is complete

/* 
FUTURE IMPLEMENTATION NOTES:
- Handle token-based family setup invitations
- Integrate with SetupWizard component 
- Support multi-family onboarding flow
- Add proper TypeScript types for Next.js App Router params (Promise-based)

Original logic (commented out for future reference):

import SetupWizard from '@/src/components/SetupWizard';

type SetupPageWithTokenProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function SetupPageWithToken({ params }: SetupPageWithTokenProps) {
  const router = useRouter();
  const { token } = await params;

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SetupWizard
        token={token}
        onComplete={handleSetupComplete}
        onCaretakerCreate={handleCaretakerCreate}
        onBabyCreate={handleBabyCreate}
      />
    </div>
  );
}
*/

export default function SetupPageWithToken() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home - setup wizard not implemented yet
    router.push('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Setup wizard coming soon...</p>
      </div>
    </div>
  );
} 