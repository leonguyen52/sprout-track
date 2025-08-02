'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SetupWizard from '@/src/components/SetupWizard';
import { Loader2, AlertCircle } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
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
    );
  }

  if (!accountStatus) {
    return null; // Should not reach here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/spourt-128.png" 
              alt="Sprout Track Logo" 
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Set Up Your Family
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Welcome, {accountStatus.firstName}! Let's set up your family dashboard and get started tracking your baby's activities.
          </p>
        </div>

        {/* Setup Wizard */}
        <div className="max-w-4xl mx-auto">
          <SetupWizard 
            onComplete={handleSetupComplete}
            // Don't pass token - this is account-based setup, not token-based
            initialSetup={false}
          />
        </div>
      </div>
    </div>
  );
}