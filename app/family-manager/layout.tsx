'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TimezoneProvider } from '../context/timezone';
import { ThemeProvider } from '@/src/context/theme';
import Image from 'next/image';
import '../globals.css';
import SettingsForm from '@/src/components/forms/SettingsForm';
import { DebugSessionTimer } from '@/src/components/debugSessionTimer';
import { TimezoneDebug } from '@/src/components/debugTimezone';
import { SideNav, SideNavTrigger } from '@/src/components/ui/side-nav';
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
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);

  // Check if screen is wider than 600px
  const checkScreenWidth = useCallback(() => {
    if (typeof window !== 'undefined') {
      const isWide = window.innerWidth > 600;
      setIsWideScreen(isWide);
      
      // Automatically open side nav on wide screens, hide on small screens
      setSideNavOpen(isWide);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Check screen width initially
    checkScreenWidth();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenWidth);

    return () => {
      // Clean up event listeners
      window.removeEventListener('resize', checkScreenWidth);
    };
  }, [checkScreenWidth]);

  if (!mounted) return null;

  return (
    <>
      <div className="min-h-screen flex">
        {/* Side Navigation - non-modal on wide screens */}
        {isWideScreen && (
          <SideNav
            isOpen={true}
            nonModal={true}
            onClose={() => {}}
            currentPath={window.location.pathname}
            onNavigate={(path) => {
              router.push(path);
            }}
            onSettingsClick={() => {
              setSettingsOpen(true);
            }}
            onLogout={() => {
              // No logout functionality needed for family manager
            }}
            isAdmin={true} // Set to true for family manager access
            className="h-screen sticky top-0"
          />
        )}
        
        {/* Main content area */}
        <div className={`flex flex-col flex-1 min-h-screen ${isWideScreen ? 'w-[calc(100%-16rem)]' : 'w-full'}`}>
          <header className="w-full bg-gradient-to-r from-teal-600 to-teal-700 sticky top-0 z-40">
            <div className="mx-auto py-2">
              <div className="flex justify-between items-center h-16"> {/* Fixed height for consistency */}
                <div className={`flex items-center ${isWideScreen ? 'ml-8' : 'ml-4 sm:ml-6 lg:ml-8'}`}>
                  {/* Only show Sprout button on small screens */}
                  {!isWideScreen ? (
                    <SideNavTrigger
                      onClick={() => setSideNavOpen(true)}
                      isOpen={sideNavOpen}
                      className="w-16 h-16 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 mr-4"
                    >
                      <Image
                        src="/sprout-128.png"
                        alt="Sprout Logo"
                        width={64}
                        height={64}
                        className="object-contain"
                        priority
                      />
                    </SideNavTrigger>
                  ) : null}
                  <div className="flex flex-col">
                    <div className="flex flex-col">
                      <h1 className="text-white text-lg font-bold">
                        Family Management
                      </h1>
                      <p className="text-white/80 text-xs">
                        Manage all families in the baby tracking system
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center mr-4 sm:mr-6 lg:mr-8">
                  {/* No family selector for top-level management */}
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 relative z-0">
            {children}
          </main>
        </div>

        {/* Modal Side Navigation - only for small screens */}
        {!isWideScreen && (
          <SideNav
            isOpen={sideNavOpen}
            onClose={() => setSideNavOpen(false)}
            currentPath={window.location.pathname}
            onNavigate={(path) => {
              router.push(path);
              setSideNavOpen(false);
            }}
            onSettingsClick={() => {
              setSettingsOpen(true);
              setSideNavOpen(false);
            }}
            onLogout={() => {
              // No logout functionality needed for family manager
            }}
            isAdmin={true} // Set to true for family manager access
          />
        )}
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
