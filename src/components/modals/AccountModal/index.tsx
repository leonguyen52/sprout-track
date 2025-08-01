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
  initialMode?: 'login' | 'register';
}

export default function AccountModal({
  open,
  onClose,
  initialMode = 'login',
}: AccountModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    familyName: '',
  });

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        familyName: '',
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

  // Password validation
  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers');
      return;
    }

    if (mode === 'register') {
      // Validate required fields for registration
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return;
      }
      
      if (!formData.familyName.trim()) {
        setError('Family name is required');
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
          familyName: formData.familyName.trim(),
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
        familyName: '',
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

      // TODO: Implement login endpoint when available
      setError('Login functionality coming soon!');

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setShowSuccess(false);
  };

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
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="account-modal-title">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription className="account-modal-description">
              {mode === 'login' 
                ? 'Sign in to access your family dashboard' 
                : 'Start tracking your baby\'s activities today'
              }
            </DialogDescription>
          </DialogHeader>

          {showSuccess ? (
            <div className="account-modal-success">
              <div className="account-modal-success-icon">✓</div>
              <h3 className="account-modal-success-title">Registration Successful!</h3>
              <p className="account-modal-success-message">
                Please check your email for verification instructions.
              </p>
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

              {/* Password */}
              <div>
                <label className="account-modal-label">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full"
                  required
                  disabled={isSubmitting}
                />
                {mode === 'register' && (
                  <p className="account-modal-help-text">
                    Must be at least 8 characters with letters and numbers
                  </p>
                )}
              </div>

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

                  <div>
                    <label className="account-modal-label">Family Name</label>
                    <Input
                      type="text"
                      value={formData.familyName}
                      onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                      placeholder="Your family name"
                      className="w-full"
                      required
                      disabled={isSubmitting}
                    />
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
                  ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
                  : (mode === 'login' ? 'Sign In' : 'Create Account')
                }
              </Button>

              {/* Mode toggle */}
              <div className="account-modal-toggle">
                <span className="account-modal-toggle-text">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                </span>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="account-modal-toggle-button"
                  disabled={isSubmitting}
                >
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}