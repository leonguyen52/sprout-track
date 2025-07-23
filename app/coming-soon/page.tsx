'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { InputButton } from '@/src/components/ui/input-button';
import { Badge } from '@/src/components/ui/badge';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { useTheme } from '@/src/context/theme';
import { useEmailValidation } from '@/src/hooks/useEmailValidation';
import './coming-soon.css';

const ComingSoon = () => {
  const { theme } = useTheme();
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const activities = ['Sleep', 'Bottles', 'Diapers', 'Baths', 'Milestones', 'Medicine'];
  
  // Email validation hook
  const { email, error, isValid, setEmail, validateEmail } = useEmailValidation();

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

  // Handle email submission
  const handleEmailSubmit = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual API integration later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - show success message
      console.log('Email submitted:', email);
      setShowSuccess(true);
      setEmail(''); // Clear the form
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
    } catch (error) {
      console.error('Error submitting email:', error);
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
            <Button size="sm" className="saas-signup-btn" asChild>
                <a href="#signup">Sign-up for the beta program!</a>
              </Button>
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
              Easily track your child's{' '}
              <span className={`saas-hero-animated-word ${isAnimating ? 'animating' : ''}`}>
                {activities[currentActivity]}
              </span>
            </h1>
            <p className="saas-hero-description">
              The complete baby tracking solution for modern families. Monitor sleep, feeding, 
              diapers, milestones, and more with our intuitive, family-friendly platform.
            </p>
            <p className="saas-hero-description">
              <b>Open source, privacy-focused, and built by parents for parents.</b>
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
          <h2 className="saas-cta-title">Interested in learning more?</h2>
          <p className="saas-cta-description">
            Our beta program is coming soon! Enter your email to get early access to the app.
          </p>
          <div className="saas-cta-actions">
            <InputButton
              layout="below"
              type="email"
              placeholder="Enter your email"
              buttonText="Get Notified!"
              buttonVariant="success"
              buttonSize="lg"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              onButtonClick={handleEmailSubmit}
              buttonLoading={isSubmitting}
              buttonDisabled={isSubmitting}
              error={error}
              containerClassName="max-w-md mx-auto"
            />
            {showSuccess && (
              <div className="mt-4 flex justify-center">
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                  ✓ Thank you for signing up! We'll notify you when the beta is ready.
                </Badge>
              </div>
            )}
          </div>
        </div>
      </section>
      

      {/* Footer */}
      <footer className="saas-footer">
       {/* <div className="saas-footer-content">
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
              The trusted baby tracking platform for modern families.
            </p>
          </div>
          <div className="saas-footer-links">
            <div className="saas-footer-column">
              <h4 className="saas-footer-heading">Product</h4>
              <a href="#" className="saas-footer-link">Features</a>
              <a href="#" className="saas-footer-link">Pricing</a>
              <a href="#" className="saas-footer-link">Security</a>
            </div>
            <div className="saas-footer-column">
              <h4 className="saas-footer-heading">Support</h4>
              <a href="#" className="saas-footer-link">Help Center</a>
              <a href="#" className="saas-footer-link">Contact Us</a>
              <a href="#" className="saas-footer-link">Status</a>
            </div>
            <div className="saas-footer-column">
              <h4 className="saas-footer-heading">Company</h4>
              <a href="#" className="saas-footer-link">About</a>
              <a href="#" className="saas-footer-link">Privacy</a>
              <a href="#" className="saas-footer-link">Terms</a>
            </div>
          </div>  
        </div> */}
        <div className="saas-footer-bottom">
          <p className="saas-footer-copyright">
            © 2025 Oak and Sprout. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
