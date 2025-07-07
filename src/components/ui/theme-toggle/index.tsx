'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/src/context/theme';
import { cn } from '@/src/lib/utils';
import { themeToggleStyles } from './theme-toggle.styles';
import { ThemeToggleProps } from './theme-toggle.types';
import './theme-toggle.css';

/**
 * ThemeToggle component
 * 
 * A component that allows cycling between light, dark, and system themes
 * with visual indication of the current active theme
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className,
  variant = "default",
  ...props
}) => {
  const { theme, toggleTheme, useSystemTheme, toggleUseSystemTheme } = useTheme();
  
  // Function to cycle between light, dark, and system modes
  const cycleTheme = () => {
    if (useSystemTheme) {
      // If currently using system, switch to explicit light mode
      // First disable system theme
      toggleUseSystemTheme();
      
      // If the current theme is dark, toggle to light
      if (theme === 'dark') {
        toggleTheme();
      }
      
      // Ensure light theme is set in localStorage
      localStorage.setItem('theme', 'light');
    } else if (theme === 'light') {
      // If light, switch to dark
      toggleTheme();
    } else {
      // If dark, switch to system
      toggleUseSystemTheme();
    }
  };

  // Determine the next theme in the cycle for the button text
  const getNextTheme = () => {
    if (useSystemTheme) return 'light';
    if (theme === 'light') return 'dark';
    return 'system';
  };

  // Get the appropriate icon and label for the current theme
  const getCurrentThemeIcon = () => {
    const iconSize = variant === 'light' ? 14 : 16;
    if (useSystemTheme) return <Monitor size={iconSize} />;
    return theme === 'light' ? <Sun size={iconSize} /> : <Moon size={iconSize} />;
  };

  const getCurrentThemeLabel = () => {
    if (useSystemTheme) return 'System';
    return theme === 'light' ? 'Light' : 'Dark';
  };

  // Render light variant
  if (variant === 'light') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          themeToggleStyles.buttonLight,
          "theme-toggle-button-light",
          className
        )}
        aria-label={`Switch to ${getNextTheme()} mode`}
        title={`Switch to ${getNextTheme()} mode`}
        {...props}
      >
        <span className="theme-icon-container-light">
          <span className="theme-icon-light">
            {getCurrentThemeIcon()}
          </span>
        </span>
        <span className="theme-info-light">
          <span className="current-theme-light">{getCurrentThemeLabel()}</span>
        </span>
      </button>
    );
  }

  // Render default variant
  return (
    <div className="theme-toggle-container">
      <div className="theme-toggle-row">
        <button
          onClick={cycleTheme}
          className={cn(
            themeToggleStyles.button,
            "theme-toggle-button",
            className
          )}
          aria-label={`Switch to ${getNextTheme()} mode`}
          title={`Switch to ${getNextTheme()} mode`}
          {...props}
        >
          <span className="theme-icon-container">
            <span className={cn(
              "theme-icon",
              useSystemTheme && "active-system",
              !useSystemTheme && theme === 'light' && "active-light",
              !useSystemTheme && theme === 'dark' && "active-dark"
            )}>
              {getCurrentThemeIcon()}
            </span>
          </span>
          <span className="theme-info">
            <span className="current-theme">{getCurrentThemeLabel()}</span>
            <span className="next-theme">Switch to {getNextTheme()}</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
