'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { AccountButton } from '@/src/components/ui/account-button';
import { useTheme } from '@/src/context/theme';
import { Github } from 'lucide-react';
import './coming-soon.css';

const ComingSoon = () => {
  const { theme } = useTheme();
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const activities = ['Sleep', 'Bottles', 'Diapers', 'Baths', 'Milestones', 'Medicine'];

  // Animated tagline effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentActivity((prev) => (prev + 1) % activities.length);
        setIsAnimating(false);
      }, 400); // Half of the transition duration
    }, 2000);
    return () => clearInterval(interval);
  }, [activities.length]);

  // Email validation
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }
      
      // Success - show success message
      setShowSuccess(true);
      setEmail('');
      setFirstName('');
      setLastName('');
      
      // Hide success message after 10 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
    } catch (error) {
      console.error('Error submitting signup:', error);
      alert('There was an error signing up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="saas-homepage">
      {/* Header */}
      <header className="saas-header">
        <nav className="saas-nav">
          <div className="saas-nav-content">
            <div className="saas-logo">
              <img 
                src="/spourt-256.png" 
                alt="Sprout Track Logo" 
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Sprout Track</span>
            </div>
            <div className="saas-nav-links">
              <AccountButton className="saas-account-btn" />
              <ThemeToggle variant="light" className="saas-theme-toggle" />
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="saas-hero">
        <div className="saas-hero-content">
          <div className="saas-hero-text">
            
            <Badge className="saas-hero-badge">
              <u>Beta</u> coming soon!
            </Badge>
            <h1 className="saas-hero-title">
              Easily track your baby's{' '}
              <span className={`saas-hero-animated-word ${isAnimating ? 'animating' : ''}`}>
                {activities[currentActivity]}
              </span>
            </h1>
            <p className="saas-hero-description">
              The complete baby tracking solution built by parents for parents. Monitor sleep, feeding, 
              diapers, milestones, and more with our intuitive, family-friendly platform.
            </p>
            <p className="saas-hero-description">
              <b>Simple to use.  Privacy-focused.  Accessible anywhere.</b>
            </p>
            {/* <div className="saas-hero-actions">
              <Button size="lg" className="saas-hero-cta">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="saas-hero-demo">
                Watch Demo
              </Button>
            </div> */}
          </div>
        </div>
      </section>

      {/* Main Demo Video Section */}
      <section className="saas-main-demo">
        <div className="saas-main-demo-content">
          <div className="saas-main-demo-video">
            <div style={{borderRadius: '5px', backgroundColor: '#0d9488', overflow: 'hidden' }}>
              <video 
                src="/Demo1.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  border: 'none'
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Transition Section with Concave Circle */}
      <section className="saas-transition-section">
        <div className="saas-transition-content"></div>
      </section>

      {/* CTA Section */}
      <section id="signup" className="saas-cta">
        <div className="saas-cta-content">
          <h2 className="saas-cta-title">Get early access, for free!</h2>
          <p className="saas-cta-description">
            Our beta program is coming soon! Enter your information to get early access to the app.
          </p>
          <div className="saas-cta-actions">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="Last name (optional)"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>
              <Button
                variant="success"
                size="lg"
                onClick={handleFormSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Signing up...' : 'Get Notified!'}
              </Button>
              <p className="saas-privacy-notice">
                This signup is only for beta notifications. We respect your privacy and will never use your information for anything else or share it with third parties.
              </p>
            </div>
            {showSuccess && (
              <div className="mt-4 flex justify-center">
                <Badge className="saas-success-badge">
                  ✓ Thank you for signing up! We'll notify you when the beta is ready.
                </Badge>
              </div>
            )}
          </div>
        </div>
      </section>
      

      {/* Footer */}
      <footer className="saas-footer">
        <div className="saas-footer-content">
          <div className="saas-footer-brand">
            <div className="saas-logo">
              <img 
                src="/spourt-256.png" 
                alt="Sprout Track Logo" 
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Sprout Track</span>
            </div>
            <p className="saas-footer-description">
              Sprouting into something amazing.
            </p>
          </div>
          <div className="saas-footer-demo">
            <Button 
              size="lg" 
              className="mb-4" 
              asChild
            >
              <a 
                href="https://demo.sprout-track.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Try the Demo
              </a>
            </Button>
            <p className="saas-footer-description text-sm mb-4">
              Demo refreshes every 2 hours
            </p>
            <div className="space-y-1">
              <p className="saas-footer-description text-sm">
                <strong>Demo Access:</strong>
              </p>
              <p className="saas-footer-description text-sm">
                Login IDs: 01, 02, 03
              </p>
              <p className="saas-footer-description text-sm">
                PIN: 111222
              </p>
            </div>
          </div>
        </div>
      <div className="saas-footer-bottom relative flex flex-col sm:flex-row items-center justify-center gap-4">
        <p className="saas-footer-copyright">
          © 2025 Oak and Sprout. All rights reserved.
        </p>
        <div className="flex items-center gap-2 saas-footer-copyright">
        <p>Follow on</p>
        <Button variant="outline" size="sm" asChild className="p-2">
            <a 
              href="https://github.com/Oak-and-Sprout/sprout-track" 
              target="_blank" 
              rel="noopener noreferrer"
              className="saas-github-link"
            >
              <Github size={16} />
            </a>
          </Button>
        </div>
          <div style={{ width: '200px' }}>
            <a href="https://www.buymeacoffee.com/joverton" className="group block">
              <img 
                src="https://img.buymeacoffee.com/button-api/?text=Support This Project&emoji=☕&slug=joverton&button_colour=008375&font_colour=ffffff&font_family=Inter&outline_colour=ffffff&coffee_colour=FFDD00" 
                alt="Support This Project" 
                style={{ width: '100%', height: 'auto', transition: 'transform 0.8s ease' }}
                className="group-hover:scale-105"
              />
            </a>
          </div>
      </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
