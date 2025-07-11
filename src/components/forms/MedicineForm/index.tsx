'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { MedicineFormProps, MedicineFormTab } from './medicine-form.types';
import { PillBottle, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { FormPage, FormPageContent, FormPageFooter } from '@/src/components/ui/form-page';
import ActiveDosesTab from './ActiveDosesTab';
import ManageMedicinesTab from './ManageMedicinesTab';
import GiveMedicineForm from '../GiveMedicineForm';
import './medicine-form.css';

/**
 * MedicineForm Component
 * 
 * A tabbed form for managing and administering medicines.
 * Includes tabs for viewing active doses, giving medicine, and managing medicines.
 * 
 * @example
 * ```tsx
 * <MedicineForm
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   babyId={selectedBaby?.id}
 *   initialTime={new Date().toISOString()}
 *   onSuccess={() => fetchData()}
 *   activity={medicineActivity} // Pass activity for editing
 * />
 * ```
 */
  const MedicineForm: React.FC<MedicineFormProps> = ({
  isOpen,
  onClose,
  babyId,
  initialTime,
  onSuccess,
  activity,
}) => {
  const [activeTab, setActiveTab] = useState<MedicineFormTab>('active-doses');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showGiveMedicineForm, setShowGiveMedicineForm] = useState(false);
  
  // Function to refresh data in all tabs
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Handle opening the Give Medicine form
  const handleOpenGiveMedicine = useCallback(() => {
    setShowGiveMedicineForm(true);
  }, []);
  
  // Handle success from GiveMedicineForm
  const handleGiveMedicineSuccess = useCallback(() => {
    setShowGiveMedicineForm(false);
    refreshData();
    
    // Call the original onSuccess if provided
    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess, refreshData]);
  
  // Set the active tab when form opens
  useEffect(() => {
    if (isOpen) {
      // If we have an activity passed in, open the Give Medicine form for editing
      if (activity) {
        setShowGiveMedicineForm(true);
      } else {
        setActiveTab('active-doses');
      }
    }
  }, [isOpen, activity]);
  
  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title="Medicine Tracker"
    >
      <FormPageContent>
        {/* Tab navigation */}
        <div className={cn(styles.tabContainer, "medicine-form-tab-container")}>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('active-doses')}
            className={cn(
              styles.tabButton, 
              "medicine-form-tab-button",
              activeTab === 'active-doses' && styles.tabButtonActive,
              activeTab === 'active-doses' && "medicine-form-tab-button-active"
            )}
          >
            Doses
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('manage-medicines')}
            className={cn(
              styles.tabButton, 
              "medicine-form-tab-button",
              activeTab === 'manage-medicines' && styles.tabButtonActive,
              activeTab === 'manage-medicines' && "medicine-form-tab-button-active"
            )}
          >
            Medicines
          </Button>
        </div>
        
        {/* Tab content - Added overflow-y-auto to enable scrolling */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'active-doses' && (
            <ActiveDosesTab
              babyId={babyId}
              refreshData={refreshData}
              onGiveMedicine={handleOpenGiveMedicine}
            />
          )}
          
          {activeTab === 'manage-medicines' && (
            <ManageMedicinesTab
              refreshData={refreshData}
            />
          )}
        </div>
      </FormPageContent>
      
      <FormPageFooter>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </FormPageFooter>
      
      {/* Give Medicine Form - overlays the main form */}
      <GiveMedicineForm
        isOpen={showGiveMedicineForm}
        onClose={() => setShowGiveMedicineForm(false)}
        babyId={babyId}
        initialTime={initialTime}
        onSuccess={handleGiveMedicineSuccess}
        refreshData={refreshData}
        activity={activity}
      />
    </FormPage>
  );
};

export default MedicineForm;
