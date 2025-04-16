'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { MedicineFormProps, MedicineFormTab } from './medicine-form.types';
import { PillBottle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { FormPage, FormPageContent, FormPageFooter } from '@/src/components/ui/form-page';
import ActiveDosesTab from './ActiveDosesTab';
import GiveMedicineTab from './GiveMedicineTab';
import ManageMedicinesTab from './ManageMedicinesTab';
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
 * />
 * ```
 */
const MedicineForm: React.FC<MedicineFormProps> = ({
  isOpen,
  onClose,
  babyId,
  initialTime,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<MedicineFormTab>('active-doses');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Function to refresh data in all tabs
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Reset to active doses tab when form opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('active-doses');
    }
  }, [isOpen]);
  
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
            Active Doses
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('give-medicine')}
            className={cn(
              styles.tabButton, 
              "medicine-form-tab-button",
              activeTab === 'give-medicine' && styles.tabButtonActive,
              activeTab === 'give-medicine' && "medicine-form-tab-button-active"
            )}
          >
            Give Medicine
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
            Manage Medicines
          </Button>
        </div>
        
        {/* Tab content */}
        <div className="flex-1">
          {activeTab === 'active-doses' && (
            <ActiveDosesTab
              babyId={babyId}
              refreshData={refreshData}
            />
          )}
          
          {activeTab === 'give-medicine' && (
            <GiveMedicineTab
              babyId={babyId}
              initialTime={initialTime}
              onSuccess={onSuccess}
              refreshData={refreshData}
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
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </FormPageFooter>
    </FormPage>
  );
};

export default MedicineForm;
