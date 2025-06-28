'use client';

import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/src/lib/utils';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we're on the root page or a page that doesn't have a family slug
    // Exclude admin pages like family-manager from redirection
    const isRootOrGenericPage = pathname === '/' || 
                               pathname === '/login' || 
                               pathname === '/setup' ||
                               pathname === '/family-select' ||
                               (!pathname?.includes('/') || pathname?.split('/').length <= 2);
    
    // Don't redirect admin pages
    const isAdminPage = pathname === '/family-manager';
    
    if (isRootOrGenericPage && !isAdminPage) {
      // Check if user has an active token
      const authToken = localStorage.getItem('authToken');
      const unlockTime = localStorage.getItem('unlockTime');

      if (authToken && unlockTime) {
        try {
          // JWT tokens are in format: header.payload.signature
          // We need the payload part (index 1)
          const payload = authToken.split('.')[1];
          // The payload is base64 encoded, so we need to decode it
          const decodedPayload = JSON.parse(atob(payload));

          // Check if token hasn't expired
          if (decodedPayload.exp && decodedPayload.exp * 1000 > Date.now()) {
            // Check if we have a family slug in the token
            if (decodedPayload.familySlug) {
              console.log('Active token found, redirecting to family:', decodedPayload.familySlug);
              // Redirect to the user's family URL
              if (pathname === '/' || pathname === '/login') {
                router.push(`/${decodedPayload.familySlug}/log-entry`);
              } else if (pathname === '/setup') {
                router.push(`/${decodedPayload.familySlug}/setup`);
              } else {
                router.push(`/${decodedPayload.familySlug}/log-entry`);
              }
              return;
            }
          } else {
            // Token expired, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('unlockTime');
            localStorage.removeItem('caretakerId');
          }
        } catch (error) {
          console.error('Error parsing JWT token in root layout:', error);
          // Invalid token, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('unlockTime');
          localStorage.removeItem('caretakerId');
        }
      }
    }
  }, [pathname, router]);

  return (
    <html lang="en" className={cn('h-full', fontSans.variable)} suppressHydrationWarning>
      <body className={cn('min-h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans antialiased')} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
