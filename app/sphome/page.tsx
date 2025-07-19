'use client';

import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { useTheme } from '@/src/context/theme';
import './sphome.css';

const SaaSHomePage = () => {
  const { theme } = useTheme();

  const features = [
    {
      title: "Sleep Tracking",
      description: "Monitor sleep patterns, duration, and quality to help establish healthy routines.",
      icon: "🛏️",
      image: "https://images.unsplash.com/photo-1520206183501-b80df61043c2?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Feed Tracking",
      description: "Track breastfeeding, bottle feeding, and solid food intake with detailed logs.",
      icon: "🍼",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Diaper Tracking",
      description: "Keep detailed records of diaper changes to monitor health and patterns.",
      icon: "👶",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Milestones & Growth",
      description: "Document precious milestones, growth measurements, and developmental progress.",
      icon: "📏",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Medicine Tracking",
      description: "Safely track medications, vitamins, and medical appointments with reminders.",
      icon: "💊",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Family Contacts",
      description: "Manage caretaker information, emergency contacts, and healthcare providers.",
      icon: "👨‍👩‍👧‍👦",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop&crop=center"
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
                src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=40&h=40&fit=crop&crop=center" 
                alt="Sprout Track Logo" 
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Sprout Track</span>
            </div>
            <div className="saas-nav-links">
              <a href="#features" className="saas-nav-link">Features</a>
              <a href="#testimonials" className="saas-nav-link">Reviews</a>
              <a href="#pricing" className="saas-nav-link">Pricing</a>
              <ThemeToggle variant="light" className="saas-theme-toggle" />
              <Button variant="outline" size="sm" className="saas-login-btn">
                Sign In
              </Button>
              <Button size="sm" className="saas-signup-btn">
                Get Started
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="saas-hero">
        <div className="saas-hero-content">
          <div className="saas-hero-text">
            <Badge className="saas-hero-badge">
              Trusted by 10,000+ families
            </Badge>
            <h1 className="saas-hero-title">
              Track Your Baby's Journey with
              <span className="saas-hero-gradient"> Confidence</span>
            </h1>
            <p className="saas-hero-description">
              The complete baby tracking solution for modern families. Monitor sleep, feeding, 
              diapers, milestones, and more with our intuitive, family-friendly platform.
            </p>
            <div className="saas-hero-actions">
              <Button size="lg" className="saas-hero-cta">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="saas-hero-demo">
                Watch Demo
              </Button>
            </div>
            <p className="saas-hero-note">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
          <div className="saas-hero-image">
            <img 
              src="https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=400&fit=crop&crop=center" 
              alt="Happy family with baby" 
              className="saas-hero-img"
            />
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
            <Button size="lg" className="saas-cta-button">
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
                src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=40&h=40&fit=crop&crop=center" 
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
