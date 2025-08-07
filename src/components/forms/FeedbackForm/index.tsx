'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { 
  FormPage, 
  FormPageContent, 
  FormPageFooter 
} from '@/src/components/ui/form-page';
import { useFamily } from '@/src/context/family';
import { useTheme } from '@/src/context/theme';
import './feedback-form.css';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FeedbackForm({
  isOpen,
  onClose,
  onSuccess,
}: FeedbackFormProps) {
  const { family } = useFamily();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitterInfo, setSubmitterInfo] = useState({
    name: '',
    email: '',
  });

  // Get submitter information from authentication context
  useEffect(() => {
    const getSubmitterInfo = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;

        // Parse JWT token to get user info
        const payload = authToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        
        // Check if this is account authentication
        if (decodedPayload.isAccountAuth) {
          // For account users, we can get email from the token
          setSubmitterInfo({
            name: decodedPayload.accountEmail ? decodedPayload.accountEmail.split('@')[0] : 'Account User',
            email: decodedPayload.accountEmail || '',
          });
        } else {
          // For caretaker users, get name from token
          setSubmitterInfo({
            name: decodedPayload.name || 'User',
            email: '', // Caretakers don't have email in the token
          });
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
        setSubmitterInfo({
          name: 'User',
          email: '',
        });
      }
    };

    if (isOpen) {
      getSubmitterInfo();
    }
  }, [isOpen]);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({
        subject: '',
        message: '',
      });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.subject.trim() || !formData.message.trim()) {
      alert('Please fill in both subject and message fields.');
      return;
    }
    
    setLoading(true);
    
    try {
      const authToken = localStorage.getItem('authToken');
      
      const payload = {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        familyId: family?.id || null,
        submitterName: submitterInfo.name,
        submitterEmail: submitterInfo.email || null,
      };
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Close the form and trigger the success callback
        onClose();
        if (onSuccess) onSuccess();
        
        // Show success message
        alert('Thank you for your feedback! We appreciate your input.');
      } else {
        console.error('Error submitting feedback:', data.error);
        alert(`Error: ${data.error || 'Failed to submit feedback'}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title="Send Feedback"
      description="Help us improve by sharing your thoughts and suggestions"
    >
      <FormPageContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Submitter Info Display */}
            <div className="feedback-form-info">
              <div className="text-sm text-gray-600 feedback-form-submitter-info">
                <p><strong>From:</strong> {submitterInfo.name}</p>
                {submitterInfo.email && (
                  <p><strong>Email:</strong> {submitterInfo.email}</p>
                )}
                {family && (
                  <p><strong>Family:</strong> {family.name}</p>
                )}
              </div>
            </div>
            
            {/* Subject */}
            <div className="space-y-2">
              <label htmlFor="subject" className="form-label">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                id="subject"
                name="subject"
                type="text"
                placeholder="Brief description of your feedback"
                value={formData.subject}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="feedback-form-input"
              />
            </div>
            
            {/* Message */}
            <div className="space-y-2">
              <label htmlFor="message" className="form-label">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Please share your detailed feedback, suggestions, or report any issues you've encountered..."
                value={formData.message}
                onChange={handleInputChange}
                required
                disabled={loading}
                rows={6}
                className="feedback-form-textarea"
              />
            </div>
            
            {/* Help Text */}
            <div className="feedback-form-help-text">
              <p className="text-sm text-gray-500">
                Your feedback helps us improve the app. Please be as specific as possible 
                about any issues or suggestions you have.
              </p>
            </div>
          </div>
        </form>
      </FormPageContent>
      
      <FormPageFooter>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.subject.trim() || !formData.message.trim()}
            variant="success"
          >
            {loading ? 'Sending...' : 'Send Feedback'}
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
}
