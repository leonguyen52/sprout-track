'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { styles } from './setup-wizard.styles';
import { SetupWizardProps } from './setup-wizard.types';
import FamilySetupStage from './FamilySetupStage';
import SecuritySetupStage from './SecuritySetupStage';
import BabySetupStage from './BabySetupStage';
import { Gender } from '@prisma/client';
import './setup-wizard.css';

/**
 * SetupWizard Component
 * 
 * A multi-stage wizard component that guides users through the initial setup process
 * for the Sprout Track application.
 * 
 * @example
 * ```tsx
 * <SetupWizard onComplete={(family) => console.log('Setup complete!', family)} />
 * ```
 */
const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, token }) => {
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Stage 1: Family setup
  const [familyName, setFamilyName] = useState('');
  const [familySlug, setFamilySlug] = useState('');
  const [createdFamily, setCreatedFamily] = useState<{ id: string; name: string; slug: string } | null>(null);
  
  // Stage 2: Security setup
  const [useSystemPin, setUseSystemPin] = useState(true);
  const [systemPin, setSystemPin] = useState('');
  const [confirmSystemPin, setConfirmSystemPin] = useState('');
  const [caretakers, setCaretakers] = useState<Array<{
    loginId: string;
    name: string;
    type: string;
    role: 'ADMIN' | 'USER';
    securityPin: string;
  }>>([]);
  const [newCaretaker, setNewCaretaker] = useState({
    loginId: '',
    name: '',
    type: '',
    role: 'ADMIN' as 'ADMIN' | 'USER', // Default to ADMIN for first caretaker
    securityPin: '',
  });
  
  // Stage 3: Baby setup
  const [babyFirstName, setBabyFirstName] = useState('');
  const [babyLastName, setBabyLastName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState<Date | null>(null);
  const [babyGender, setBabyGender] = useState<Gender | ''>('');
  const [feedWarningTime, setFeedWarningTime] = useState('02:00');
  const [diaperWarningTime, setDiaperWarningTime] = useState('03:00');
  
  // Error handling
  const [error, setError] = useState('');

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    };
  };

  const handleNext = async () => {
    setError('');
    
    if (stage === 1) {
      // Validate family name and slug
      if (!familyName.trim()) {
        setError('Please enter a family name');
        return;
      }

      if (!familySlug.trim()) {
        setError('Please enter a family URL');
        return;
      }

      // Basic slug validation
      const slugPattern = /^[a-z0-9-]+$/;
      if (!slugPattern.test(familySlug)) {
        setError('Family URL can only contain lowercase letters, numbers, and hyphens');
        return;
      }

      if (familySlug.length < 3) {
        setError('Family URL must be at least 3 characters long');
        return;
      }
      
      try {
        setLoading(true);
        // Create family using the setup/start endpoint
        const response = await fetch('/api/setup/start', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: familyName,
            slug: familySlug,
            token: token, // Include token if this is invitation-based setup
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Store the created family for later use
          setCreatedFamily(data.data);
          setStage(2);
        } else {
          setError(data.error || 'Failed to create family');
        }
      } catch (error) {
        console.error('Error creating family:', error);
        setError('Failed to create family. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (stage === 2) {
      // Validate security setup
      if (useSystemPin) {
        if (systemPin.length < 6 || systemPin.length > 10) {
          setError('PIN must be between 6 and 10 digits');
          return;
        }
        
        if (systemPin !== confirmSystemPin) {
          setError('PINs do not match');
          return;
        }
        
        try {
          setLoading(true);
          // Save system PIN to settings for the created family
          const response = await fetch(`/api/settings?familyId=${createdFamily?.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              securityPin: systemPin,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save security PIN');
          }
          
          setStage(3);
        } catch (error) {
          console.error('Error saving security PIN:', error);
          setError('Failed to save security PIN. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        // Validate caretakers
        if (caretakers.length === 0) {
          setError('Please add at least one caretaker');
          return;
        }
        
        try {
          setLoading(true);
          // Save caretakers for the created family
          for (const caretaker of caretakers) {
            const response = await fetch('/api/caretaker', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                ...caretaker,
              }),
            });
            
            if (!response.ok) {
              throw new Error(`Failed to save caretaker: ${caretaker.name}`);
            }
          }
          
          setStage(3);
        } catch (error) {
          console.error('Error saving caretakers:', error);
          setError('Failed to save caretakers. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } else if (stage === 3) {
      // Validate baby information
      if (!babyFirstName.trim()) {
        setError('Please enter baby\'s first name');
        return;
      }
      
      if (!babyLastName.trim()) {
        setError('Please enter baby\'s last name');
        return;
      }
      
      if (!babyBirthDate) {
        setError('Please enter baby\'s birth date');
        return;
      }
      
      if (!babyGender) {
        setError('Please select baby\'s gender');
        return;
      }
      
      try {
        setLoading(true);
        // Save baby information for the created family
        const response = await fetch('/api/baby', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            firstName: babyFirstName,
            lastName: babyLastName,
            birthDate: new Date(babyBirthDate),
            gender: babyGender,
            feedWarningTime,
            diaperWarningTime,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save baby information');
        }
        
        // Setup complete - pass the family data to the callback
        if (createdFamily) {
          onComplete(createdFamily);
        }
      } catch (error) {
        console.error('Error saving baby information:', error);
        setError('Failed to save baby information. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (stage > 1) {
      setStage(stage - 1);
      setError('');
    }
  };

  const addCaretaker = () => {
    // Validate caretaker
    if (newCaretaker.loginId.length !== 2) {
      setError('Login ID must be exactly 2 characters');
      return;
    }
    
    if (!newCaretaker.name.trim()) {
      setError('Please enter caretaker name');
      return;
    }
    
    if (newCaretaker.securityPin.length < 6 || newCaretaker.securityPin.length > 10) {
      setError('PIN must be between 6 and 10 digits');
      return;
    }
    
    // Add caretaker to list
    setCaretakers([...caretakers, { ...newCaretaker }]);
    
    // Reset form
    setNewCaretaker({
      loginId: '',
      name: '',
      type: '',
      role: 'USER',
      securityPin: '',
    });
    
    setError('');
  };

  const removeCaretaker = (index: number) => {
    const updatedCaretakers = [...caretakers];
    updatedCaretakers.splice(index, 1);
    setCaretakers(updatedCaretakers);
  };

  return (
    <div className={cn(styles.container, "setup-wizard-container")}>
      <div className={cn(styles.formContainer, "setup-wizard-form-container")}>
        {/* Stage-specific image and Header */}
        <div className={cn(styles.headerContainer, "setup-wizard-header-container")}>
          <Image
            src={
              stage === 1 
                ? "/SetupFamily-1024.png" 
                : stage === 2 
                  ? "/SetupSecurity-1024.png" 
                  : "/SetupBaby-1024.png"
            }
            alt={
              stage === 1 
                ? "Family Setup" 
                : stage === 2 
                  ? "Security Setup" 
                  : "Baby Setup"
            }
            width={128}
            height={128}
            className={cn(styles.stageImage, "setup-wizard-stage-image")}
          />
          <h1 className={cn(styles.title, "setup-wizard-title")}>Sprout Track</h1>
          <div className={cn(styles.progressBar, "setup-wizard-progress-bar")}>
            <div 
              className={cn(styles.progressIndicator, "setup-wizard-progress-indicator")}
              style={{ width: `${(stage / 3) * 100}%` }}
            ></div>
          </div>
          <p className={cn(styles.stepIndicator, "setup-wizard-step-indicator")}>
            Step {stage} of 3
          </p>
        </div>

        {/* Stage 1: Family Setup */}
        {stage === 1 && (
          <FamilySetupStage
            familyName={familyName}
            setFamilyName={setFamilyName}
            familySlug={familySlug}
            setFamilySlug={setFamilySlug}
            token={token}
          />
        )}

        {/* Stage 2: Security Setup */}
        {stage === 2 && (
          <SecuritySetupStage
            useSystemPin={useSystemPin}
            setUseSystemPin={setUseSystemPin}
            systemPin={systemPin}
            setSystemPin={setSystemPin}
            confirmSystemPin={confirmSystemPin}
            setConfirmSystemPin={setConfirmSystemPin}
            caretakers={caretakers}
            setCaretakers={setCaretakers}
            newCaretaker={newCaretaker}
            setNewCaretaker={setNewCaretaker}
            addCaretaker={addCaretaker}
            removeCaretaker={removeCaretaker}
          />
        )}

        {/* Stage 3: Baby Setup */}
        {stage === 3 && (
          <BabySetupStage
            babyFirstName={babyFirstName}
            setBabyFirstName={setBabyFirstName}
            babyLastName={babyLastName}
            setBabyLastName={setBabyLastName}
            babyBirthDate={babyBirthDate}
            setBabyBirthDate={setBabyBirthDate}
            babyGender={babyGender}
            setBabyGender={setBabyGender}
            feedWarningTime={feedWarningTime}
            setFeedWarningTime={setFeedWarningTime}
            diaperWarningTime={diaperWarningTime}
            setDiaperWarningTime={setDiaperWarningTime}
          />
        )}

        {/* Error message */}
        {error && (
          <div className={cn(styles.errorContainer, "setup-wizard-error-container")}>
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className={cn(styles.navigationContainer, "setup-wizard-navigation-container")}>
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={stage === 1 || loading}
            className={cn(styles.previousButton, "setup-wizard-previous-button")}
          >
            {stage === 1 ? 'Cancel' : 'Previous'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className={cn(styles.nextButton, "setup-wizard-next-button")}
          >
            {loading ? 'Processing...' : stage === 3 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
