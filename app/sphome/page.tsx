'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { useTheme } from '@/src/context/theme';
import { 
  Moon, 
  Baby, 
  Ruler, 
  Pill, 
  Users, 
  Zap, 
  Target, 
  Smartphone, 
  Lock, 
  BarChart3,
  Play
} from 'lucide-react';
import './sphome.css';

const SaaSHomePage = () => {
  const { theme } = useTheme();
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
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

  const features = [
    {
      title: "Sleep Tracking",
      description: "Monitor sleep patterns, duration, and quality to help establish healthy routines.",
      icon: <Moon size={20} />,
      image: "https://images.unsplash.com/photo-1520206183501-b80df61043c2?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Feed Tracking",
      description: "Track breastfeeding, bottle feeding, and solid food intake with detailed logs.",
      icon: <Baby size={20} />,
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Diaper Tracking",
      description: "Keep detailed records of diaper changes to monitor health and patterns.",
      icon: <Baby size={20} />,
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Milestones & Growth",
      description: "Document precious milestones, growth measurements, and developmental progress.",
      icon: <Ruler size={20} />,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Medicine Tracking",
      description: "Safely track medications, vitamins, and medical appointments with reminders.",
      icon: <Pill size={20} />,
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Family Contacts",
      description: "Manage caretaker information, emergency contacts, and healthcare providers.",
      icon: <Users size={20} />,
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop&crop=center"
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "New Mom",
      content: "Sprout Track has been a lifesaver! I can easily share feeding schedules with my partner and track our baby's patterns.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face"
    },
    {
      name: "David & Lisa",
      role: "Parents of Twins",
      content: "Managing two babies was overwhelming until we found Sprout Track. The multi-caretaker features are perfect for our family.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
    },
    {
      name: "Jennifer K.",
      role: "Working Mom",
      content: "The detailed reports help me communicate with our daycare provider. Everyone stays on the same page about our baby's needs.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
    }
  ];

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
              <a href="#mobile-first" className="saas-nav-link">Mobile First</a>
              <a href="#easy-tracking" className="saas-nav-link">Easy Tracking</a>
              <a href="#caretakers" className="saas-nav-link">Caretakers</a>
              
              <Button variant="outline" size="sm" className="saas-login-btn">
                Sign In
              </Button>
              <Button size="sm" className="saas-signup-btn">
                Get Started
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
              In < u>Beta</u> now!  Try it for free!
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

      {/* Mobile First Section */}
      <section id="mobile-first" className="saas-feature-section">
        <div className="saas-feature-content">
          <div className="saas-feature-text">
            <h2 className="saas-feature-title">Mobile first, but available everywhere</h2>
            <p className="saas-feature-description">
              Designed by busy parents for busy parents. Start tracking on your phone, 
              continue on your tablet, and share with your partner seamlessly across all devices.
            </p>
            <div className="saas-feature-stats">
              <div className="saas-stat">
                <span className="saas-stat-number">98%</span>
                <span className="saas-stat-label">Mobile usage</span>
              </div>
              <div className="saas-stat">
                <span className="saas-stat-number">3 sec</span>
                <span className="saas-stat-label">Average log time</span>
              </div>
            </div>
          </div>
          <div className="saas-feature-video">
            <div className="saas-video-placeholder">
              <img 
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop&crop=center" 
                alt="Mobile and Tablet Demo" 
                className="saas-feature-thumbnail"
              />
              <div className="saas-play-button-small">
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Play size={24} fill="#0d9488" color="#0d9488" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Easy Tracking Section */}
      <section id="easy-tracking" className="saas-feature-section saas-feature-reverse">
        <div className="saas-feature-content">
          <div className="saas-feature-text">
            <h2 className="saas-feature-title">Easy to add activities - because your time is at premium</h2>
            <p className="saas-feature-description">
              Log a feeding in less than 3 clicks. Our streamlined interface gets you back to 
              what matters most - spending time with your little one.
            </p>
            <div className="saas-feature-highlights">
              <div className="saas-highlight">
                <span className="saas-highlight-icon"><Zap size={20} /></span>
                <span>Quick entry forms</span>
              </div>
              <div className="saas-highlight">
                <span className="saas-highlight-icon"><Target size={20} /></span>
                <span>Smart defaults</span>
              </div>
              <div className="saas-highlight">
                <span className="saas-highlight-icon"><Smartphone size={20} /></span>
                <span>One-tap logging</span>
              </div>
            </div>
          </div>
          <div className="saas-feature-video">
            <div className="saas-video-placeholder">
              <img 
                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&crop=center" 
                alt="Quick Activity Logging Demo" 
                className="saas-feature-thumbnail"
              />
              <div className="saas-play-button-small">
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Play size={24} fill="#0d9488" color="#0d9488" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caretakers Section */}
      <section id="caretakers" className="saas-feature-section">
        <div className="saas-feature-content">
          <div className="saas-feature-text">
            <h2 className="saas-feature-title">Add caretakers without having to sign up</h2>
            <p className="saas-feature-description">
              The family has its own space, and you can control who has access with easy-to-use 
              IDs and PINs. Set up family, babysitters, or nannies with access to get updates when you need them.
            </p>
            <div className="saas-feature-benefits">
              <div className="saas-benefit">
                <span className="saas-benefit-icon"><Lock size={24} /></span>
                <div>
                  <h4>Secure PIN access</h4>
                  <p>No email required for caretakers</p>
                </div>
              </div>
              <div className="saas-benefit">
                <span className="saas-benefit-icon"><Users size={24} /></span>
                <div>
                  <h4>Family-controlled</h4>
                  <p>You decide who gets access</p>
                </div>
              </div>
              <div className="saas-benefit">
                <span className="saas-benefit-icon"><BarChart3 size={24} /></span>
                <div>
                  <h4>Real-time updates</h4>
                  <p>Everyone stays informed</p>
                </div>
              </div>
            </div>
          </div>
          <div className="saas-feature-video">
            <div className="saas-video-placeholder">
              <img 
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop&crop=center" 
                alt="Caretaker Access Demo" 
                className="saas-feature-thumbnail"
              />
              <div className="saas-play-button-small">
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Play size={24} fill="#0d9488" color="#0d9488" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="saas-features">
        <div className="saas-features-content">
          <div className="saas-features-header">
            <h2 className="saas-features-title">Everything You Need to Track Your Baby's Growth</h2>
            <p className="saas-features-description">
              Comprehensive tracking tools designed by parents, for parents. Keep your entire family connected and informed.
            </p>
          </div>
          <div className="saas-features-grid">
            {features.map((feature, index) => (
              <Card key={index} className="saas-feature-card">
                <CardHeader className="saas-feature-header">
                  <div className="saas-feature-icon-wrapper">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="saas-feature-image"
                    />
                    <div className="saas-feature-icon">{feature.icon}</div>
                  </div>
                  <CardTitle className="saas-feature-title">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="saas-feature-description">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="saas-testimonials">
        <div className="saas-testimonials-content">
          <h2 className="saas-testimonials-title">Loved by Families Everywhere</h2>
          <div className="saas-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="saas-testimonial-card">
                <CardContent className="saas-testimonial-content">
                  <p className="saas-testimonial-text">"{testimonial.content}"</p>
                  <div className="saas-testimonial-author">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="saas-testimonial-avatar"
                    />
                    <div>
                      <p className="saas-testimonial-name">{testimonial.name}</p>
                      <p className="saas-testimonial-role">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="saas-cta">
        <div className="saas-cta-content">
          <h2 className="saas-cta-title">Ready to Start Your Journey?</h2>
          <p className="saas-cta-description">
            Join thousands of families who trust Sprout Track to document their baby's precious moments.
          </p>
          <div className="saas-cta-actions">
            <Button size="lg" variant="success">
              Start Your Free Trial
            </Button>
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
        </div>
        <div className="saas-footer-bottom">
          <p className="saas-footer-copyright">
            © 2025 Sprout Track. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SaaSHomePage;
