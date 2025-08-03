'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { CheckCircle, XCircle, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

type ResetState = 'loading' | 'valid' | 'invalid' | 'success' | 'error';

interface ResetResult {
  success: boolean;
  message: string;
}

export default function ResetPasswordForm() {
  const [state, setState] = useState<ResetState>('loading');
  const [result, setResult] = useState<ResetResult | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setState('invalid');
        setError('Reset token is missing from the URL.');
        return;
      }

      try {
        const response = await fetch(`/api/accounts/reset-password?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok && data.success) {
          if (data.data.valid) {
            setState('valid');
            setUserEmail(data.data.email || '');
          } else {
            setState('invalid');
            setError('Invalid or expired reset token.');
          }
        } else {
          setState('invalid');
          setError(data.error || 'Token validation failed');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setState('invalid');
        setError('Network error. Please check your connection and try again.');
      }
    };

    validateToken();
  }, [token]);

  // Handle countdown and redirect for success
  useEffect(() => {
    if (state === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to home page
            setTimeout(() => {
              router.push('/coming-soon');
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state, router]);

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return false;
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      setValidationError('Password must contain at least one letter');
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setValidationError('Password must contain at least one number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    if (!validatePassword(password)) {
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/accounts/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState('success');
        setResult(data.data);
      } else {
        setState('error');
        setError(data.error || 'Password reset failed');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setState('error');
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRedirect = () => {
    router.push('/coming-soon');
  };

  const handleReturnHome = () => {
    router.push('/coming-soon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/spourt-256.png" 
                alt="Sprout Track Logo" 
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          </div>

          {/* Content */}
          <div className="p-6">
            {state === 'loading' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  Validating Reset Token
                </h2>
                <p className="text-slate-600">
                  Please wait while we validate your password reset request...
                </p>
              </div>
            )}

            {state === 'valid' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">
                    Set New Password
                  </h2>
                  <p className="text-slate-600">
                    Enter your new password for {userEmail}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pr-10"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pr-10"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="text-sm text-slate-600">
                    <p className="mb-1">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 8 characters</li>
                      <li>At least one letter</li>
                      <li>At least one number</li>
                    </ul>
                  </div>

                  {/* Validation Error */}
                  {validationError && (
                    <div className="text-red-600 text-sm">
                      {validationError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  Password Reset Successful!
                </h2>
                <p className="text-slate-600 mb-4">
                  {result?.message}
                </p>
                
                <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
                  You can now log in with your new password! 🎉
                </Badge>

                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-600 mb-2">
                    Redirecting to login in {countdown} seconds...
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(6 - countdown) * 20}%` }}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleManualRedirect}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                >
                  Go to Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {(state === 'invalid' || state === 'error') && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  {state === 'invalid' ? 'Invalid Reset Link' : 'Reset Failed'}
                </h2>
                <p className="text-slate-600 mb-4">
                  {error}
                </p>
                
                <div className="space-y-2">
                  {state === 'invalid' && (
                    <p className="text-sm text-slate-500 mb-4">
                      Password reset links expire after 15 minutes for security.
                    </p>
                  )}
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={handleReturnHome}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
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
          <p className="text-sm text-slate-500">
            Having trouble? Contact us at{' '}
            <a 
              href="mailto:support@sprout-track.com" 
              className="text-orange-600 hover:text-orange-700 underline"
            >
              support@sprout-track.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
