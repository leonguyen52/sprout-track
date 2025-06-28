'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { X } from 'lucide-react';
import { useTheme } from '@/src/context/theme';
import './login-security.css';
import { ApiResponse } from '@/app/api/types';

interface LoginSecurityProps {
  onUnlock: (caretakerId?: string) => void;
  familySlug?: string;
}

export default function LoginSecurity({ onUnlock, familySlug }: LoginSecurityProps) {
  const { theme } = useTheme();
  const [loginId, setLoginId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [hasCaretakers, setHasCaretakers] = useState(false);
  const [activeInput, setActiveInput] = useState<'loginId' | 'pin'>('loginId');

  // Reset form when component mounts and check for server-side IP lockout
  useEffect(() => {
    setPin('');
    setLoginId('');
    setError('');
    
    // Check for server-side IP lockout
    const checkIpLockout = async () => {
      try {
        const response = await fetch('/api/auth/ip-lockout');
        const data = await response.json() as ApiResponse<{ locked: boolean; remainingTime: number }>;
        
        if (data.success && data.data && data.data.locked) {
          const remainingTime = data.data.remainingTime || 300000; // Default to 5 minutes if not provided
          const remainingMinutes = Math.ceil(remainingTime / 60000);
          setLockoutTime(Date.now() + remainingTime);
          setError(`Too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`);
        }
      } catch (error) {
        console.error('Error checking IP lockout:', error);
      }
    };
    
    checkIpLockout();
  }, []);

  // Update lockout timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTime) {
      timer = setInterval(() => {
        if (Date.now() >= lockoutTime) {
          setLockoutTime(null);
          setAttempts(0);
          localStorage.removeItem('lockoutTime');
          localStorage.removeItem('attempts');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  // Check if any caretakers exist
  useEffect(() => {
    const checkCaretakers = async () => {
      try {
        let url = '/api/auth/caretaker-exists';
        if (familySlug) {
          url += `?familySlug=${encodeURIComponent(familySlug)}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const caretakersExist = data.success && data.data.exists;
          setHasCaretakers(caretakersExist);
          
          // If no caretakers exist, focus on the PIN field immediately
          if (!caretakersExist) {
            setActiveInput('pin');
          }
        }
      } catch (error) {
        console.error('Error checking caretakers:', error);
      }
    };
    
    checkCaretakers();
  }, [familySlug]);

  const handleLoginIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 2) {
      setLoginId(value);
      setError('');
    }
    if (value.length === 2) {
      setActiveInput('pin');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPin(value);
      setError('');
    }
  };

  // Handle number pad input for either login ID or PIN
  const handleNumberClick = (number: string) => {
    if (lockoutTime) return; // Prevent input during lockout

    if (activeInput === 'loginId') {
      // Handle login ID input
      if (loginId.length < 2) {
        const newLoginId = loginId + number;
        setLoginId(newLoginId);
        setError('');
        
        // Automatically switch to PIN input when login ID is complete
        if (newLoginId.length === 2) {
          setActiveInput('pin');
        }
      }
    } else {
      // Handle PIN input
      const newPin = pin + number;
      if (newPin.length <= 10) {
        setPin(newPin);
        setError('');
      }
    }
  };

  const handleAuthenticate = async () => {
    // Don't attempt authentication if login ID is required but not complete
    if (hasCaretakers && loginId.length !== 2) {
      setError('Please enter a valid 2-character login ID first');
      setActiveInput('loginId');
      return;
    }

    // Don't attempt authentication if PIN is too short
    if (pin.length < 6) {
      setError('Please enter a PIN with at least 6 digits');
      setActiveInput('pin');
      return;
    }

    try {
      // Check for server-side IP lockout first
      const ipCheckResponse = await fetch('/api/auth/ip-lockout');
      const ipCheckData = await ipCheckResponse.json() as ApiResponse<{ locked: boolean; remainingTime: number }>;
      
      if (ipCheckData.success && ipCheckData.data && ipCheckData.data.locked) {
        const remainingTime = ipCheckData.data.remainingTime || 300000; // Default to 5 minutes if not provided
        const remainingMinutes = Math.ceil(remainingTime / 60000);
        setLockoutTime(Date.now() + remainingTime);
        setError(`Too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`);
        return;
      }
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginId: hasCaretakers ? loginId : undefined,
          securityPin: pin,
          familySlug: familySlug,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store unlock time, token, and caretaker ID
        localStorage.setItem('unlockTime', Date.now().toString());
        localStorage.setItem('caretakerId', data.data.id);
        localStorage.setItem('authToken', data.data.token);
        
        // Get the AUTH_LIFE and IDLE_TIME values for client-side timeout checks
        const authLifeResponse = await fetch('/api/settings/auth-life');
        const authLifeData = await authLifeResponse.json();
        if (authLifeData.success) {
          localStorage.setItem('authLifeSeconds', authLifeData.data.toString());
        }
        
        // Get the IDLE_TIME value
        const idleTimeResponse = await fetch('/api/settings/idle-time');
        const idleTimeData = await idleTimeResponse.json();
        if (idleTimeData.success) {
          localStorage.setItem('idleTimeSeconds', idleTimeData.data.toString());
        }
        
        // Call the onUnlock callback
        onUnlock(data.data.id);
      } else {
        // Failed authentication attempt - the server will handle counting attempts
        setError('Invalid credentials');
        setPin('');
        
        // Check if we're now locked out
        const lockoutCheckResponse = await fetch('/api/auth/ip-lockout');
        const lockoutCheckData = await lockoutCheckResponse.json() as ApiResponse<{ locked: boolean; remainingTime: number }>;
        
        if (lockoutCheckData.success && lockoutCheckData.data && lockoutCheckData.data.locked) {
          const remainingTime = lockoutCheckData.data.remainingTime || 300000; // Default to 5 minutes if not provided
          const remainingMinutes = Math.ceil(remainingTime / 60000);
          setLockoutTime(Date.now() + remainingTime);
          setError(`Too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
      setPin('');
    }
  };

  const handleDelete = () => {
    if (!lockoutTime) {
      if (activeInput === 'pin' && pin.length > 0) {
        setPin(pin.slice(0, -1));
      } else if (activeInput === 'loginId' && loginId.length > 0) {
        setLoginId(loginId.slice(0, -1));
      } else if (activeInput === 'pin' && pin.length === 0 && loginId.length > 0) {
        // Switch back to login ID if PIN is empty
        setActiveInput('loginId');
      }
      setError('');
    }
  };

  const handleFocusLoginId = () => {
    setActiveInput('loginId');
  };

  const handleFocusPin = () => {
    setActiveInput('pin');
  };

  const formatTimeRemaining = (lockoutTime: number) => {
    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white login-container">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="text-center mt-2 mb-4">
          <h2 className="text-xl font-semibold login-title">Security Check</h2>
          <p id="pin-description" className="text-sm text-gray-500 login-description">
            {!hasCaretakers
              ? 'Please enter your system security PIN'
              : 'Please enter your login ID and security PIN'}
          </p>
        </div>
        <div className="flex flex-col items-center space-y-4 pb-6 pl-6 pr-6">
          <div className="w-24 h-24 p-1 flex items-center justify-center">
            <Image
              src="/sprout-128.png"
              alt="Sprout Logo"
              width={128}
              height={128}
              className="object-contain"
              priority
            />
          </div>
          
          <div className="w-full max-w-[240px] space-y-6">
            {/* Login ID section - only show if caretakers exist */}
            {hasCaretakers && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900 text-center login-card-title">Login ID</h2>
                
                {/* Login ID Display */}
                <div 
                  className="flex gap-2 justify-center my-2 cursor-pointer" 
                  onClick={handleFocusLoginId}
                >
                  {loginId.length === 0 ? (
                    // Show 2 placeholder dots when no input
                    Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${activeInput === 'loginId' ? 'bg-gray-300 security-dot-focus' : 'bg-gray-200/50 security-dot-placeholder'}`}
                      />
                    ))
                  ) : (
                    // Show actual characters for entered login ID
                    Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${i < loginId.length ? 'bg-teal-600 security-dot-active' : 'bg-gray-200/50 security-dot-placeholder'}`}
                      />
                    ))
                  )}
                </div>
                <Input
                  value={loginId}
                  onChange={handleLoginIdChange}
                  className="text-center text-xl font-semibold sr-only login-input"
                  placeholder="ID"
                  maxLength={2}
                  autoFocus={activeInput === 'loginId'}
                  onFocus={handleFocusLoginId}
                  disabled={!!lockoutTime}
                />
              </div>
            )}
            
            {/* PIN input section */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 text-center login-card-title">Security PIN</h2>
              
              {/* PIN Display */}
              <div 
                className="flex gap-2 justify-center my-2 cursor-pointer" 
                onClick={handleFocusPin}
              >
                {pin.length === 0 ? (
                  // Show 6 placeholder dots when no input
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${activeInput === 'pin' ? 'bg-gray-300 security-dot-focus' : 'bg-gray-200/50 security-dot-placeholder'}`}
                    />
                  ))
                ) : (
                  // Show actual number of dots for entered digits
                  Array.from({ length: Math.max(pin.length, 6) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < pin.length ? 'bg-teal-600 security-dot-active' : 'bg-gray-200/50 security-dot-placeholder'}`}
                    />
                  ))
                )}
              </div>
              <Input
                type="password"
                value={pin}
                onChange={handlePinChange}
                className="text-center text-xl font-semibold sr-only login-input"
                placeholder="PIN"
                maxLength={10}
                autoFocus={activeInput === 'pin'}
                onFocus={handleFocusPin}
                disabled={!!lockoutTime}
              />
            </div>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm login-error">
              {error}
              {lockoutTime && ` (${formatTimeRemaining(lockoutTime)})`}
            </p>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <Button
                key={number}
                variant="outline"
                className="w-14 h-14 text-xl font-semibold rounded-xl hover:bg-teal-50 disabled:opacity-50 security-numpad-button"
                onClick={() => handleNumberClick(number.toString())}
                disabled={!!lockoutTime}
              >
                {number}
              </Button>
            ))}
            <Button
              key="0"
              variant="outline"
              className="w-14 h-14 text-xl font-semibold rounded-xl hover:bg-teal-50 disabled:opacity-50 security-numpad-button"
              onClick={() => handleNumberClick("0")}
              disabled={!!lockoutTime}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="w-14 h-14 text-xl font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 security-delete-button"
              onClick={handleDelete}
              disabled={!!lockoutTime}
            >
              <X className="h-6 w-6" />
            </Button>
            {/* Go Button integrated into keypad */}
            <Button
              variant="default"
              className="w-14 h-14 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 security-go-button"
              onClick={handleAuthenticate}
              disabled={!!lockoutTime || (hasCaretakers && loginId.length !== 2) || pin.length < 6}
            >
              Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
