'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { AccountButton } from '@/src/components/ui/account-button';
import SetupWizard from '@/src/components/SetupWizard';
import AccountModal from '@/src/components/modals/AccountModal';
import { Loader2, AlertCircle } from 'lucide-react';
import '../../coming-soon/coming-soon.css';

interface AccountStatus {
  accountId: string;
  email: string;
  firstName: string;
  verified: boolean;
  hasFamily: boolean;
  familySlug?: string;
}

export default function AccountFamilySetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  
  // Account modal state
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    const checkAccountStatus = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // Not logged in - redirect to coming soon page
        router.push('/coming-soon');
        return;
      }

      try {
        const response = await fetch('/api/accounts/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const status = data.data;
            
            // Check if user is verified
            if (!status.verified) {
              setError('Please verify your email address before setting up your family.');
              setIsLoading(false);
              return;
            }
            
            // Check if family already exists
            if (status.hasFamily) {
              // Already has family - redirect to family dashboard
              router.push(`/${status.familySlug}`);
              return;
            }
            
            // All good - can proceed with family setup
            setAccountStatus(status);
            setIsLoading(false);
          } else {
            setError('Failed to verify account status.');
            setIsLoading(false);
          }
        } else {
          // Token might be invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('accountUser');
          router.push('/coming-soon');
        }
      } catch (error) {
        console.error('Error checking account status:', error);
        setError('Network error. Please check your connection.');
        setIsLoading(false);
      }
    };

    checkAccountStatus();
  }, [router]);

  const handleSetupComplete = (family: { id: string; name: string; slug: string }) => {
    console.log('Family setup completed:', family);
    
    // Update localStorage with family info
    const accountUser = localStorage.getItem('accountUser');
    if (accountUser) {
      try {
        const user = JSON.parse(accountUser);
        user.familySlug = family.slug;
        localStorage.setItem('accountUser', JSON.stringify(user));
      } catch (error) {
        console.error('Error updating cached user info:', error);
      }
    }
    
    // Redirect to family dashboard
    router.push(`/${family.slug}`);
  };

  if (isLoading) {
    return (
      <div className="saas-homepage">
        {/* Header */}
        <header className="saas-header">
          <nav className="saas-nav">
            <div className="saas-nav-content">
              <Link href="/" className="saas-logo">
                <img 
                  src="/spourt-256.png" 
                  alt="Sprout Track Logo" 
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Sprout Track</span>
              </Link>
              <div className="saas-nav-links">
                <AccountButton className="saas-account-btn" />
                <ThemeToggle variant="light" className="saas-theme-toggle" />
              </div>
            </div>
          </nav>
        </header>

        {/* Loading Content */}
        <div className="min-h-screen flex items-center justify-center p-4" style={{ paddingTop: '6rem' }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Checking Account Status
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we verify your account...
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="saas-footer">
          <div className="saas-footer-content">
            <div className="saas-footer-brand">
              <Link href="/" className="saas-logo">
                <img 
                  src="/spourt-256.png" 
                  alt="Sprout Track Logo" 
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Sprout Track</span>
              </Link>
              <p className="saas-footer-description">
                Sprouting into something amazing.
              </p>
            </div>
            <div className="saas-footer-demo">
              <Button 
                size="lg" 
                className="mb-4" 
                asChild
              >
                <a 
                  href="https://demo.sprout-track.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Try the Demo
                </a>
              </Button>
              <p className="saas-footer-description text-sm mb-4">
                Demo refreshes every 2 hours
              </p>
              <div className="space-y-1">
                <p className="saas-footer-description text-sm">
                  <strong>Demo Access:</strong>
                </p>
                <p className="saas-footer-description text-sm">
                  Login IDs: 01, 02, 03
                </p>
                <p className="saas-footer-description text-sm">
                  PIN: 111222
                </p>
              </div>
            </div>
          </div>
          <div className="saas-footer-bottom relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="saas-footer-copyright">
              © 2025 Oak and Sprout. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saas-homepage">
        {/* Header */}
        <header className="saas-header">
          <nav className="saas-nav">
            <div className="saas-nav-content">
              <Link href="/" className="saas-logo">
                <img 
                  src="/spourt-256.png" 
                  alt="Sprout Track Logo" 
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Sprout Track</span>
              </Link>
              <div className="saas-nav-links">
                <AccountButton className="saas-account-btn" />
                <ThemeToggle variant="light" className="saas-theme-toggle" />
              </div>
            </div>
          </nav>
        </header>

        {/* Error Content */}
        <div className="min-h-screen flex items-center justify-center p-4" style={{ paddingTop: '6rem' }}>
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => router.push('/coming-soon')}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="saas-footer">
          <div className="saas-footer-content">
            <div className="saas-footer-brand">
              <Link href="/" className="saas-logo">
                <img 
                  src="/spourt-256.png" 
                  alt="Sprout Track Logo" 
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Sprout Track</span>
              </Link>
              <p className="saas-footer-description">
                Sprouting into something amazing.
              </p>
            </div>
            <div className="saas-footer-demo">
              <Button 
                size="lg" 
                className="mb-4" 
                asChild
              >
                <a 
                  href="https://demo.sprout-track.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Try the Demo
                </a>
              </Button>
              <p className="saas-footer-description text-sm mb-4">
                Demo refreshes every 2 hours
              </p>
              <div className="space-y-1">
                <p className="saas-footer-description text-sm">
                  <strong>Demo Access:</strong>
                </p>
                <p className="saas-footer-description text-sm">
                  Login IDs: 01, 02, 03
                </p>
                <p className="saas-footer-description text-sm">
                  PIN: 111222
                </p>
              </div>
            </div>
          </div>
          <div className="saas-footer-bottom relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="saas-footer-copyright">
              © 2025 Oak and Sprout. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (!accountStatus) {
    return null; // Should not reach here
  }

  return (
    <div className="saas-homepage">
      {/* Header */}
      <header className="saas-header">
        <nav className="saas-nav">
          <div className="saas-nav-content">
            <Link href="/" className="saas-logo">
              <img 
                src="/spourt-256.png" 
                alt="Sprout Track Logo" 
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Sprout Track</span>
            </Link>
            <div className="saas-nav-links">
              <AccountButton className="saas-account-btn" />
              <ThemeToggle variant="light" className="saas-theme-toggle" />
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="w-full h-full">
          {/* Setup Wizard */}
          <SetupWizard 
            onComplete={handleSetupComplete}
            initialSetup={false}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="saas-footer">
        <div className="saas-footer-content">
          <div className="saas-footer-brand">
            <Link href="/" className="saas-logo">
              <img 
                src="/spourt-256.png" 
                alt="Sprout Track Logo" 
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Sprout Track</span>
            </Link>
            <p className="saas-footer-description">
              Sprouting into something amazing.
            </p>
          </div>
          <div className="saas-footer-demo">
            <Button 
              size="lg" 
              className="mb-4" 
              asChild
            >
              <a 
                href="https://demo.sprout-track.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Try the Demo
              </a>
            </Button>
            <p className="saas-footer-description text-sm mb-4">
              Demo refreshes every 2 hours
            </p>
            <div className="space-y-1">
              <p className="saas-footer-description text-sm">
                <strong>Demo Access:</strong>
              </p>
              <p className="saas-footer-description text-sm">
                Login IDs: 01, 02, 03
              </p>
              <p className="saas-footer-description text-sm">
                PIN: 111222
              </p>
            </div>
          </div>
        </div>
        <div className="saas-footer-bottom relative flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="saas-footer-copyright">
            © 2025 Oak and Sprout. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Account Modal */}
      <AccountModal 
        open={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
      />
    </div>
  );
}
