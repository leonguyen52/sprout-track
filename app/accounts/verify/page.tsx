'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

type VerificationState = 'loading' | 'success' | 'error' | 'already-verified';

interface VerificationResult {
  success: boolean;
  message: string;
  familySlug?: string;
  redirectUrl?: string;
}

export default function VerifyAccountPage() {
  const [state, setState] = useState<VerificationState>('loading');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(5);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');

  // Handle verification
  useEffect(() => {
    const verifyAccount = async () => {
      // Check for error parameters first
      if (errorParam) {
        setState('error');
        switch (errorParam) {
          case 'missing-token':
            setError('Verification token is missing from the URL.');
            break;
          case 'invalid-token':
            setError('Invalid or expired verification token.');
            break;
          case 'verification-failed':
            setError('Verification failed due to a server error.');
            break;
          default:
            setError('An unknown error occurred during verification.');
        }
        return;
      }

      if (!token) {
        setState('error');
        setError('Verification token is missing from the URL.');
        return;
      }

      try {
        const response = await fetch('/api/accounts/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setState(data.data.success ? 'success' : 'already-verified');
          setResult(data.data);
        } else {
          setState('error');
          setError(data.error || 'Verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setState('error');
        setError('Network error. Please check your connection and try again.');
      }
    };

    verifyAccount();
  }, [token, errorParam]);

  // Handle countdown and redirect for success
  useEffect(() => {
    if (state === 'success' && result?.redirectUrl) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Use setTimeout to ensure navigation happens after render cycle
            setTimeout(() => {
              router.push(result.redirectUrl!);
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state, result, router]);

  const handleManualRedirect = () => {
    if (result?.redirectUrl) {
      router.push(result.redirectUrl);
    } else if (result?.familySlug) {
      router.push(`/${result.familySlug}`);
    }
  };

  const handleReturnHome = () => {
    router.push('/coming-soon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/spourt-128.png" 
                alt="Sprout Track Logo" 
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">Account Verification</h1>
          </div>

          {/* Content */}
          <div className="p-6">
            {state === 'loading' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Verifying Your Account
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Verification Successful!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {result?.message}
                </p>
                
                <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
                  Welcome to Sprout Track! 🎉
                </Badge>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Redirecting to your family dashboard in {countdown} seconds...
                  </p>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-600 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(6 - countdown) * 20}%` }}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleManualRedirect}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                >
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {state === 'already-verified' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Already Verified
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Your account is already verified. You can access your dashboard now.
                </p>
                
                <Button 
                  onClick={handleManualRedirect}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white mb-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Verification Failed
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {error}
                </p>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={handleReturnHome}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                  >
                    Return to Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Having trouble? Contact us at{' '}
            <a 
              href="mailto:support@sprout-track.com" 
              className="text-teal-600 hover:text-teal-700 underline"
            >
              support@sprout-track.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}