'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut, Home } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import AccountModal from '@/src/components/modals/AccountModal';
import './account-button.css';

interface AccountUser {
  firstName: string;
  email: string;
  familySlug: string;
}

interface AccountButtonProps {
  className?: string;
}

export function AccountButton({ className }: AccountButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountUser, setAccountUser] = useState<AccountUser | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Check authentication status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userInfo = localStorage.getItem('accountUser');
      
      if (token && userInfo) {
        try {
          const user = JSON.parse(userInfo);
          setAccountUser(user);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user info:', error);
          handleLogout();
        }
      } else {
        setIsLoggedIn(false);
        setAccountUser(null);
      }
    };

    checkAuthStatus();

    // Listen for storage changes (in case user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'accountUser') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      // Call the logout API to invalidate the token server-side
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with client-side logout even if API fails
    }

    // Clear client-side auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('accountUser');
    localStorage.removeItem('unlockTime');
    localStorage.removeItem('caretakerId');
    
    // Update state
    setIsLoggedIn(false);
    setAccountUser(null);
    
    // Redirect to home page
    window.location.href = '/';
  };

  const handleFamilyLink = () => {
    // Update activity timer when navigating
    const unlockTime = localStorage.getItem('unlockTime');
    if (unlockTime) {
      localStorage.setItem('unlockTime', Date.now().toString());
    }
    
    if (accountUser?.familySlug) {
      window.location.href = `/${accountUser.familySlug}`;
    }
  };

  if (isLoggedIn && accountUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`account-button-logged-in ${className}`}
          >
            <User className="w-4 h-4 mr-2" />
            Hi, {accountUser.firstName}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{accountUser.firstName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {accountUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleFamilyLink}>
            <Home className="w-4 h-4 mr-2" />
            Go to Family Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={`account-button-guest ${className}`}
        onClick={() => setShowAccountModal(true)}
      >
        <User className="w-4 h-4 mr-2" />
        Login
      </Button>
      
      <AccountModal 
        open={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
        initialMode="login"
      />
    </>
  );
}

export default AccountButton;