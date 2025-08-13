import { ThemeProvider } from '@/src/context/theme';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sprout Track - The Shareable Baby Tracking Solution',
  description: 'Track your baby\'s sleep, feeding, diapers, milestones, and more with our intuitive, family-friendly platform. Simple to use, privacy-focused, accessible anywhere. Join the beta for free!',
  keywords: [
    'baby tracker',
    'baby tracking app', 
    'infant care',
    'baby feeding tracker',
    'baby sleep tracker',
    'diaper tracker',
    'baby milestones',
    'newborn care',
    'baby care app',
    'family tracking',
    'caretaker coordination',
    'baby activities',
    'parenting tools'
  ],
  authors: [{ name: 'Oak and Sprout' }],
  creator: 'Oak and Sprout',
  publisher: 'Oak and Sprout',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.sprout-track.com',
    title: 'Sprout Track - The Shareable Baby Tracking Solution',
    description: 'Track your baby\'s sleep, feeding, diapers, milestones, and more with our intuitive, family-friendly platform. Simple to use, privacy-focused, accessible anywhere.',
    siteName: 'Sprout Track',
    images: [
      {
        url: '/sprout-256.png',
        width: 256,
        height: 256,
        alt: 'Sprout Track Logo - Baby Tracking App',
      },
    ],
  },
  // twitter: {
    // card: 'summary_large_image',
    // title: 'Sprout Track - The Shareable Baby Tracking Solution',
    // description: 'Track your baby\'s sleep, feeding, diapers, milestones, and more. Join our beta for free!',
    // images: ['/spourt-256.png'],
    // creator: '@SproutTrackApp', // Update when Twitter account exists
  // },
  verification: {
    google: '', // Add Google Search Console verification code when available
    // yandex: '', // Add if targeting international markets
    // yahoo: '', // Add if needed
  },
  alternates: {
    canonical: 'https://www.sprout-track.com',
  },
  category: 'technology',
};

export default function SaaSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
