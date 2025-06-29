'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TimezoneProvider } from '../context/timezone';
import { ThemeProvider } from '@/src/context/theme';
import Image from 'next/image';
import '../globals.css';
import './layout.css';
import SettingsForm from '@/src/components/forms/SettingsForm';
import { DebugSessionTimer } from '@/src/components/debugSessionTimer';
import { TimezoneDebug } from '@/src/components/debugTimezone';
import ThemeToggle from '@/src/components/ui/theme-toggle';
import { Inter as FontSans } from 'next/font/google';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

function AppContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="min-h-screen flex flex-col">
        {/* Main content area */}
        <div className="flex flex-col flex-1 min-h-screen w-full">
          <header className="w-full bg-gradient-to-r from-teal-600 to-teal-700 sticky top-0 z-40">
            <div className="mx-auto py-2">
              <div className="flex justify-between items-center h-16"> {/* Fixed height for consistency */}
                <div className="flex items-center ml-4 sm:ml-6 lg:ml-8">
                  <Image
                    src="/sprout-128.png"
                    alt="Sprout Logo"
                    width={64}
                    height={64}
                    className="object-contain mr-4"
                    priority
                  />
                  <div className="flex flex-col">
                    <h1 className="text-white text-lg font-bold">
                      Family Management
                    </h1>
                    <p className="text-white/80 text-xs">
                      View and manage all families in Sprout Track
                    </p>
                  </div>
                </div>
                <div className="flex items-center mr-4 sm:mr-6 lg:mr-8">
                  <ThemeToggle variant="light" />
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 relative z-0">
            {children}
          </main>
        </div>
      </div>

      <SettingsForm
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onBabyStatusChange={() => {}} // No special handling needed
      />
      
      {/* Debug components - only visible in development mode */}
      <DebugSessionTimer />
      <TimezoneDebug />
    </>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TimezoneProvider>
      <ThemeProvider>
        <AppContent>{children}</AppContent>
      </ThemeProvider>
    </TimezoneProvider>
  );
}
