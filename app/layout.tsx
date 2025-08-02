'use client';

import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/src/lib/utils';
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
  // Layout is now responsible only for rendering - redirect logic moved to individual pages

  return (
    <html lang="en" className={cn('h-full', fontSans.variable)} suppressHydrationWarning>
      <body className={cn('min-h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans antialiased')} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
