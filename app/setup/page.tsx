'use client';

import SetupWizard from '@/src/components/SetupWizard';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/src/context/theme';

export default function SetupPage() {
  const router = useRouter();

  const handleSetupComplete = (family: { id: string; name: string; slug: string }) => {
    // On completion, redirect to the login page for the newly created family
    router.push(`/${family.slug}/login`);
  };

  const handleCaretakerCreate = () => {
    // In the new flow, caretakers are created after the initial setup.
    // This can be a no-op for now or log for debugging.
    console.log('Caretaker creation will be handled in a later step.');
  };

  const handleBabyCreate = () => {
    // In the new flow, babies are created after the initial setup.
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