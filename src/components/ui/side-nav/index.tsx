import React, { useEffect, useState } from 'react';
import ChangelogModal from '@/src/components/modals/changelog';
import FeedbackForm from '@/src/components/forms/FeedbackForm';
import { X, Settings, LogOut, MessageSquare } from 'lucide-react';
import ThemeToggle from '@/src/components/ui/theme-toggle';
import Image from 'next/image';
import { useTheme } from '@/src/context/theme';
import { useDeployment } from '@/app/context/deployment';
import { cn } from '@/src/lib/utils';
import { sideNavStyles, triggerButtonVariants } from './side-nav.styles';
import { SideNavProps, SideNavTriggerProps, SideNavItemProps } from './side-nav.types';
import { ReactNode } from 'react';
import './side-nav.css'; // Import the CSS file with dark mode overrides
import packageInfo from '@/package.json';

// Interface for the FooterButton component
interface FooterButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

/**
 * FooterButton component
 * 
 * A button used in the footer of the side navigation
 */
const FooterButton: React.FC<FooterButtonProps> = ({
  icon,
  label,
  onClick,
  ariaLabel,
}) => {
  return (
    <button
      className={cn(sideNavStyles.settingsButton, "side-nav-settings-button")}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className={sideNavStyles.settingsIcon}>{icon}</span>
      <span className={sideNavStyles.settingsLabel}>{label}</span>
    </button>
  );
};

/**
 * SideNavTrigger component
 * 
 * A button that toggles the side navigation menu
 */
export const SideNavTrigger: React.FC<SideNavTriggerProps> = ({
  onClick,
  isOpen,
  className,
  children,
}) => {
  return (
    <div 
      onClick={onClick}
      className={cn(triggerButtonVariants({ isOpen }), className)}
    >
      {children}
    </div>
  );
};

/**
 * SideNavItem component
 * 
 * An individual navigation item in the side navigation menu
 */
export const SideNavItem: React.FC<SideNavItemProps> = ({
  path,
  label,
  icon,
  isActive,
  onClick,
  className,
}) => {
  return (
    <button
      className={cn(
        sideNavStyles.navItem,
        isActive && sideNavStyles.navItemActive,
        className,
        isActive && "active" // Add active class for CSS targeting
      )}
      onClick={() => onClick(path)}
    >
      {icon && <span className={sideNavStyles.navItemIcon}>{icon}</span>}
      <span className={sideNavStyles.navItemLabel}>{label}</span>
    </button>
  );
};

/**
 * SideNav component
 * 
 * A responsive side navigation menu that slides in from the left
 */
/**
 * SideNav component
 * 
 * A responsive side navigation menu that slides in from the left
 */
export const SideNav: React.FC<SideNavProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  onSettingsClick,
  onLogout,
  isAdmin,
  className,
  nonModal = false,
}) => {
  const { theme } = useTheme();
  const { isSaasMode } = useDeployment();
  const [isSystemDarkMode, setIsSystemDarkMode] = useState<boolean>(false);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  
  // Check if system is in dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsSystemDarkMode(darkModeMediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setIsSystemDarkMode(e.matches);
      };
      
      darkModeMediaQuery.addEventListener('change', handleChange);
      return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  // Close the side nav when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !nonModal) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent scrolling when side nav is open in modal mode
    if (isOpen && !nonModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, nonModal]);

  return (
    <>
      {/* Overlay - only shown in modal mode */}
      {!nonModal && (
        <div 
          className={cn(
            sideNavStyles.overlay,
            isOpen ? sideNavStyles.overlayOpen : sideNavStyles.overlayClosed
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Side Navigation Panel */}
      <div
        className={cn(
          nonModal ? sideNavStyles.containerNonModal : sideNavStyles.container,
          !nonModal && (isOpen ? sideNavStyles.containerOpen : sideNavStyles.containerClosed),
          className,
          "side-nav" // Add this class for direct CSS targeting
        )}
        role={nonModal ? "navigation" : "dialog"}
        aria-modal={nonModal ? "false" : "true"}
        aria-label="Main navigation"
      >
        {/* Header - matching the structure of the green bar in the main layout */}
        <header className="w-full bg-white sticky top-0 z-40 side-nav-header">
          <div className="mx-auto">
            <div className={cn("flex justify-between items-center h-20", sideNavStyles.header)}>
              {isSaasMode ? (
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className={cn(sideNavStyles.logoContainer, "cursor-pointer hover:opacity-80 transition-opacity")}
                  aria-label="Go to home page"
                >
                  <Image
                    src="/sprout-128.png"
                    alt="Sprout Logo"
                    width={40}
                    height={40}
                    className={sideNavStyles.logo}
                    priority
                  />
                  <span className={cn(sideNavStyles.appName, "side-nav-app-name")}>Sprout Track</span>
                </button>
              ) : (
                <div className={sideNavStyles.logoContainer}>
                  <Image
                    src="/sprout-128.png"
                    alt="Sprout Logo"
                    width={40}
                    height={40}
                    className={sideNavStyles.logo}
                    priority
                  />
                  <span className={cn(sideNavStyles.appName, "side-nav-app-name")}>Sprout Track</span>
                </div>
              )}
              {/* Only show close button in modal mode */}
              {!nonModal && (
                <button
                  onClick={onClose}
                  className={cn(sideNavStyles.closeButton, "side-nav-close-button")}
                  aria-label="Close navigation"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Navigation Items */}
        <nav className={sideNavStyles.navItems}>
          <SideNavItem
            path="/log-entry"
            label="Log Entry"
            isActive={currentPath === '/log-entry'}
            onClick={onNavigate}
            className="side-nav-item"
          />
          <SideNavItem
            path="/full-log"
            label="Full Log"
            isActive={currentPath === '/full-log'}
            onClick={onNavigate}
            className="side-nav-item"
          />
          <SideNavItem
            path="/calendar"
            label="Calendar"
            isActive={currentPath === '/calendar'}
            onClick={onNavigate}
            className="side-nav-item"
          />
          <SideNavItem
            path="/chart"
            label="Chart"
            isActive={currentPath === '/chart'}
            onClick={onNavigate}
            className="side-nav-item"
          />
        </nav>

        {/* Version display at bottom of nav items */}
        <div className="w-full text-center mb-4">
          <span 
            className="text-xs text-gray-500 cursor-pointer hover:text-teal-600 transition-colors"
            onClick={() => setShowChangelog(true)}
            aria-label="View changelog"
          >
            v{packageInfo.version}
          </span>
          
          {/* Feedback link - only shown in SaaS mode */}
          {isSaasMode && (
            <div className="mt-2">
              <button
                className="flex items-center justify-center w-full text-xs text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => setShowFeedback(true)}
                aria-label="Provide feedback about the app"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Send Feedback
              </button>
            </div>
          )}
        </div>

        {/* Changelog Modal */}
        <ChangelogModal 
          open={showChangelog} 
          onClose={() => setShowChangelog(false)} 
          version={packageInfo.version}
        />

        {/* Feedback Form - only shown in SaaS mode */}
        {isSaasMode && (
          <FeedbackForm
            isOpen={showFeedback}
            onClose={() => setShowFeedback(false)}
            onSuccess={() => {
              setShowFeedback(false);
              // Optionally close the side nav after successful feedback submission
              if (!nonModal) {
                onClose();
              }
            }}
          />
        )}

        {/* Footer with Theme Toggle, Settings and Logout */}
        <div className={cn(sideNavStyles.footer, "side-nav-footer")}>
          {/* Theme Toggle Component */}
          <ThemeToggle className="mb-2" />
          
          {/* Settings Button - only shown for admins */}
          {isAdmin && (
            <FooterButton
              icon={<Settings />}
              label="Settings"
              onClick={onSettingsClick}
            />
          )}
          
          {/* Logout Button */}
          <FooterButton
            icon={<LogOut />}
            label="Logout"
            onClick={onLogout}
          />
        </div>
      </div>
    </>
  );
};

export default SideNav;
