import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useState, useEffect } from 'react';
import './account-modal.css';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'verify';
  verificationToken?: string;
}

export default function AccountModal({
  open,
  onClose,
  initialMode = 'register',
  verificationToken,
}: AccountModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'verify'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  // Password validation state for real-time feedback
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  // Verification state
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationCountdown, setVerificationCountdown] = useState(3);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      });
      setPasswordValidation({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
      });
      setError('');
      setShowSuccess(false);
      setMode(initialMode);
    }
  }, [open, initialMode]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation - 8+ chars, lowercase, uppercase, numbers, special characters
  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    // SQL-safe special characters
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' };
    }
    
    return { isValid: true };
  };

  // Real-time password validation for visual feedback
  const updatePasswordValidation = (password: string) => {
    setPasswordValidation({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'forgot-password') {
      // For forgot password, we only need email
      await handleForgotPassword();
      return;
    }

    // Validate password for login and register modes
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Invalid password');
      return;
    }

    if (mode === 'register') {
      // Validate required fields for registration
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return;
      }

      await handleRegister();
    } else {
      await handleLogin();
    }
  };

  const handleRegister = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/accounts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message
      setShowSuccess(true);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      });
      setPasswordValidation({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/accounts/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store the token in localStorage
        localStorage.setItem('authToken', result.data.token);
        
        // Set unlock time for session management (account holders are considered "unlocked")
        localStorage.setItem('unlockTime', Date.now().toString());
        
        // Store user info for the AccountButton
        localStorage.setItem('accountUser', JSON.stringify({
          firstName: result.data.user.firstName,
          email: result.data.user.email,
          familySlug: result.data.user.familySlug || null,
        }));
        
        // Clear form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        });
        setPasswordValidation({
          length: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false,
        });
        
        // Close modal immediately and refresh page to show logged-in state
        onClose();
        
        // Refresh the page so the AccountButton updates to show logged-in state
        window.location.reload();
        
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!formData.email.trim()) {
        setError('Please enter your email address');
        return;
      }

      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      const response = await fetch('/api/accounts/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success message
        setShowSuccess(true);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        });
        setPasswordValidation({
          length: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false,
        });

        // Auto-close after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 3000);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    if (mode === 'login') {
      setMode('register');
    } else if (mode === 'register') {
      setMode('login');
    } else if (mode === 'forgot-password') {
      setMode('login');
    }
    setError('');
    setShowSuccess(false);
  };

  const showForgotPassword = () => {
    setMode('forgot-password');
    setError('');
    setShowSuccess(false);
  };

  // Handle email verification
  const handleVerification = async (token: string) => {
    if (!token) {
      setVerificationState('error');
      setVerificationMessage('Verification token is missing from the URL.');
      return;
    }

    try {
      setVerificationState('loading');
      const response = await fetch('/api/accounts/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationState('success');
        setVerificationMessage(data.data.message || 'Account verified successfully!');
        
        // Start countdown to login
        setVerificationCountdown(3);
        const timer = setInterval(() => {
          setVerificationCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // Transition to login mode
              setMode('login');
              setVerificationState('loading');
              setError('');
              setShowSuccess(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setVerificationState('error');
        setVerificationMessage(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationState('error');
      setVerificationMessage('Network error. Please check your connection and try again.');
    }
  };

  // Handle verification when modal opens with verify mode
  useEffect(() => {
    if (mode === 'verify' && verificationToken && open) {
      handleVerification(verificationToken);
    }
  }, [mode, verificationToken, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="account-modal-content !p-0 max-w-md">
        {/* Header with Logo */}
        <div className="account-modal-header">
          <div className="account-modal-logo">
            <img 
              src="/spourt-256.png" 
              alt="Sprout Track Logo" 
              className="w-8 h-8"
            />
            <span className="account-modal-brand">Sprout Track</span>
          </div>
        </div>

        <div className="account-modal-body">
          {!showSuccess && (
            <DialogHeader className="text-center mb-6">
              <DialogTitle className="account-modal-title text-center">
                {mode === 'login' 
                  ? 'Welcome Back' 
                  : mode === 'register' 
                  ? 'The Sprout Track Beta Is Active!' 
                  : mode === 'verify'
                  ? 'Email Verification'
                  : 'Reset Password'
                }
              </DialogTitle>
              <DialogDescription className="account-modal-description text-center">
                {mode === 'login' 
                  ? 'Sign in to access your family dashboard' 
                  : mode === 'register'
                  ? 'Set up your account to get started for free! Beta users get free access for life!'
                  : mode === 'verify'
                  ? 'Verifying your email address...'
                  : 'Enter your email to receive a password reset link'
                }
              </DialogDescription>
              
              {/* Mode toggle in header - hide during verification */}
              {mode !== 'verify' && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {mode === 'login' 
                      ? "Don't have an account?" 
                      : mode === 'register'
                      ? "Already have an account?"
                      : "Remember your password?"
                    }
                  </span>
                  {' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm ml-2 font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors duration-200 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm px-1"
                    disabled={isSubmitting}
                  >
                    {mode === 'login' 
                      ? 'Create one' 
                      : mode === 'register'
                      ? 'Log in'
                      : 'Back to login'
                    }
                  </button>
                </div>
              )}
            </DialogHeader>
          )}

          {showSuccess ? (
            <div className="account-modal-success">
              <div className="account-modal-success-icon">✓</div>
              <h3 className="account-modal-success-title">
                {mode === 'forgot-password' ? 'Email Sent!' : 'Registration Successful!'}
              </h3>
              <p className="account-modal-success-message">
                {mode === 'forgot-password' 
                  ? 'If an account with that email exists, we\'ve sent password reset instructions. Check your email and follow the link to reset your password.'
                  : 'Please check your email for verification instructions.'
                }
              </p>
            </div>
          ) : mode === 'verify' ? (
            <div className="account-modal-body">
              {verificationState === 'loading' && (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Verifying Your Account
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please wait while we verify your email address...
                  </p>
                </div>
              )}

              {verificationState === 'success' && (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">✓</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Verification Successful!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {verificationMessage}
                  </p>
                  
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 mb-4">
                    <p className="text-sm text-teal-700 dark:text-teal-300 mb-2">
                      Switching to login in {verificationCountdown} seconds...
                    </p>
                    <div className="w-full bg-teal-200 dark:bg-teal-800 rounded-full h-2">
                      <div 
                        className="bg-teal-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((3 - verificationCountdown) / 3) * 100}%` }}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      setMode('login');
                      setVerificationState('loading');
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Continue to Login
                  </Button>
                </div>
              )}

              {verificationState === 'error' && (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">✕</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Verification Failed
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {verificationMessage}
                  </p>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => {
                        if (verificationToken) {
                          handleVerification(verificationToken);
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => setMode('register')}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Create New Account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="account-modal-label">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Password - Not shown in forgot password mode */}
              {mode !== 'forgot-password' && (
                <div>
                  <label className="account-modal-label">Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setFormData({ ...formData, password: newPassword });
                      if (mode === 'register') {
                        updatePasswordValidation(newPassword);
                      }
                    }}
                    placeholder="Enter your password"
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                  {mode === 'register' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className={`flex items-center gap-2 ${passwordValidation.length ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${passwordValidation.length ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {passwordValidation.length && '✓'}
                          </span>
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.lowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${passwordValidation.lowercase ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {passwordValidation.lowercase && '✓'}
                          </span>
                          One lowercase letter (a-z)
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${passwordValidation.uppercase ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {passwordValidation.uppercase && '✓'}
                          </span>
                          One uppercase letter (A-Z)
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.number ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${passwordValidation.number ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {passwordValidation.number && '✓'}
                          </span>
                          One number (0-9)
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.special ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${passwordValidation.special ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {passwordValidation.special && '✓'}
                          </span>
                          One special character (!@#$%^&*)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Registration fields */}
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="account-modal-label">First Name</label>
                      <Input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First name"
                        className="w-full"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="account-modal-label">Last Name</label>
                      <Input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last name"
                        className="w-full"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Error message */}
              {error && (
                <div className="account-modal-error">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="account-modal-submit"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (mode === 'login' ? 'Signing in...' : mode === 'register' ? 'Creating account...' : 'Sending email...') 
                  : (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Email')
                }
              </Button>

              {/* Mode toggle and forgot password */}
              <div className="space-y-3">
                {/* Forgot Password link for login mode */}
                {mode === 'login' && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={showForgotPassword}
                      className="account-modal-toggle-button text-sm"
                      disabled={isSubmitting}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}