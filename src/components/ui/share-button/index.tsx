'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/src/lib/utils"
import { useTheme } from "@/src/context/theme"
import { Share, Copy, Check } from 'lucide-react'

import { shareButtonVariants } from "./share-button.styles"
import { ShareButtonProps } from "./share-button.types"
import "./share-button.css"

/**
 * ShareButton component for sharing family login URLs
 *
 * This component generates and shares family login URLs using the app config
 * settings for domain and HTTPS. It automatically detects mobile devices
 * and uses native sharing when available, falling back to clipboard copy.
 *
 * Features:
 * - Fetches domain config from app settings
 * - Uses native Web Share API on mobile devices
 * - Falls back to clipboard copy on desktop
 * - Visual feedback for copy success
 * - Follows the project's design system and color scheme
 *
 * @example
 * ```tsx
 * <ShareButton 
 *   familySlug="my-family" 
 *   familyName="The Smith Family"
 *   variant="ghost" 
 *   size="sm" 
 * />
 * ```
 */
const ShareButton = React.forwardRef<HTMLButtonElement, ShareButtonProps>(
  ({ className, variant, size, asChild = false, familySlug, familyName, appConfig, urlSuffix = "/login", showText = true, ...props }, ref) => {
    const { theme } = useTheme();
    const [copied, setCopied] = React.useState(false);
    const [shareUrl, setShareUrl] = React.useState<string>('');
    const [supportsNativeShare, setSupportsNativeShare] = React.useState(false);

    // Check if native Web Share API is supported (typically mobile)
    React.useEffect(() => {
      setSupportsNativeShare(
        typeof navigator !== 'undefined' && 
        'share' in navigator
      );
    }, []);

    // Generate the share URL
    React.useEffect(() => {
      const generateShareUrl = async () => {
        try {
          // Use passed appConfig if available, otherwise fetch from API
          if (appConfig) {
            const { rootDomain, enableHttps } = appConfig;
            const protocol = enableHttps ? 'https' : 'http';
            const url = `${protocol}://${rootDomain}/${familySlug}${urlSuffix}`;
            setShareUrl(url);
          } else {
            // Fallback to API call if no config passed
            const response = await fetch('/api/app-config/public');
            const data = await response.json();
            
            if (data.success) {
              const { rootDomain, enableHttps } = data.data;
              const protocol = enableHttps ? 'https' : 'http';
              const url = `${protocol}://${rootDomain}/${familySlug}${urlSuffix}`;
              setShareUrl(url);
            } else {
              // Fallback to current domain if API fails
              const currentDomain = window.location.host;
              const currentProtocol = window.location.protocol;
              const url = `${currentProtocol}//${currentDomain}/${familySlug}${urlSuffix}`;
              setShareUrl(url);
            }
          }
        } catch (error) {
          console.error('Error generating share URL:', error);
          // Fallback to current domain
          const currentDomain = window.location.host;
          const currentProtocol = window.location.protocol;
          const url = `${currentProtocol}//${currentDomain}/${familySlug}${urlSuffix}`;
          setShareUrl(url);
        }
      };

      if (familySlug) {
        generateShareUrl();
      }
    }, [familySlug, appConfig, urlSuffix]);

    const handleShare = async () => {
      if (!shareUrl) return;

      const shareData = {
        title: `${familyName || 'Baby Tracker'} - Family Login`,
        text: `Join the ${familyName || 'family'} baby tracker`,
        url: shareUrl,
      };

      // Try native share first (mobile)
      if (supportsNativeShare) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          // If native share fails or is cancelled, fall back to clipboard
          console.log('Native share cancelled or failed, falling back to clipboard');
        }
      }

      // Fallback to clipboard copy (desktop/unsupported devices)
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Final fallback - show the URL in an alert
        alert(`Share this URL: ${shareUrl}`);
      }
    };

    // Don't render until we have a URL
    if (!shareUrl) {
      return null;
    }

    // Add dark mode specific classes based on variant
    const darkModeClass = variant === 'outline' ? 'share-button-dark-outline' : 
                          variant === 'ghost' ? 'share-button-dark-ghost' : 
                          variant === 'link' ? 'share-button-dark-link' : '';
    
    // Add copied state class
    const copiedClass = copied ? 'share-button-copied' : '';

    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(
          shareButtonVariants({ 
            variant, 
            size, 
            state: copied ? 'copied' : 'normal',
            className 
          }), 
          darkModeClass,
          copiedClass
        )}
        ref={ref}
        onClick={handleShare}
        title={supportsNativeShare ? 'Share family login' : 'Copy link to clipboard'}
        {...props}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : supportsNativeShare ? (
          <Share className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {showText && (
          <span className="ml-1">
            {copied ? 'Copied!' : supportsNativeShare ? 'Share' : 'Copy'}
          </span>
        )}
      </Comp>
    )
  }
)
ShareButton.displayName = "ShareButton"

export { ShareButton, shareButtonVariants }
export type { ShareButtonProps } 