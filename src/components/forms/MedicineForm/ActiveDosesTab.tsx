'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { ActiveDosesTabProps, MedicineLogWithDetails, ActiveDose } from './medicine-form.types';
import { PillBottle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useTimezone } from '@/app/context/timezone';

/**
 * ActiveDosesTab Component
 * 
 * Displays active medicine doses for a baby with countdown timers
 * showing when the next dose is safe to administer.
 */
const ActiveDosesTab: React.FC<ActiveDosesTabProps> = ({ babyId, refreshData }) => {
  const { formatDate, calculateDurationMinutes } = useTimezone();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDoses, setActiveDoses] = useState<ActiveDose[]>([]);
  
  // Function to process medicine logs into active doses
  const createActiveDoses = useCallback((logs: MedicineLogWithDetails[] | null): ActiveDose[] => {
    const doses: ActiveDose[] = [];
    
    // Return empty array if logs is null or not an array
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return doses;
    }
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Group logs by medicine
    const medicineGroups = logs.reduce((groups, log) => {
      const key = log.medicine.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
      return groups;
    }, {} as Record<string, MedicineLogWithDetails[]>);
    
    // Process each medicine group
    Object.values(medicineGroups).forEach((medicineGroup: MedicineLogWithDetails[]) => {
      if (!medicineGroup.length) return;
      
      // Sort by time, most recent first
      medicineGroup.sort((a: MedicineLogWithDetails, b: MedicineLogWithDetails) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      
      const latestLog = medicineGroup[0];
      const medicine = latestLog.medicine;
      
      // Calculate if it's safe to give another dose
      let isSafe = true;
      let nextDoseTime = "";
      let minutesRemaining = 0;
      let doseMinTime = "00:00:30"; // Default to 30 minutes if not specified
      
      if (medicine.doseMinTime) {
        doseMinTime = medicine.doseMinTime;
        
        // Validate doseMinTime format (DD:HH:MM)
        const timeRegex = /^([0-9]{1,2}):([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (timeRegex.test(medicine.doseMinTime)) {
          const [days, hours, minutes] = medicine.doseMinTime.split(':').map(Number);
          const minTimeMs = ((days * 24 * 60) + (hours * 60) + minutes) * 60 * 1000;
          const lastDoseTime = new Date(latestLog.time).getTime();
          
          try {
            const safeTime = new Date(lastDoseTime + minTimeMs);
            
            // Check if the date is valid before calling toISOString()
            if (!isNaN(safeTime.getTime())) {
              nextDoseTime = safeTime.toISOString();
              isSafe = safeTime <= now;
              
              if (!isSafe) {
                minutesRemaining = calculateDurationMinutes(now.toISOString(), safeTime.toISOString());
              }
            } else {
              console.warn(`Invalid date calculation for medicine ${medicine.name}`);
              isSafe = true; // Default to safe if we can't calculate
            }
          } catch (error) {
            console.error(`Error calculating next dose time for ${medicine.name}:`, error);
            isSafe = true; // Default to safe if there's an error
          }
        } else {
          // Try the old HH:MM format for backward compatibility
          const oldTimeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
          if (oldTimeRegex.test(medicine.doseMinTime)) {
            const [hours, minutes] = medicine.doseMinTime.split(':').map(Number);
            const minTimeMs = (hours * 60 + minutes) * 60 * 1000;
            const lastDoseTime = new Date(latestLog.time).getTime();
            
            try {
              const safeTime = new Date(lastDoseTime + minTimeMs);
              
              // Check if the date is valid before calling toISOString()
              if (!isNaN(safeTime.getTime())) {
                nextDoseTime = safeTime.toISOString();
                isSafe = safeTime <= now;
                
                if (!isSafe) {
                  minutesRemaining = calculateDurationMinutes(now.toISOString(), safeTime.toISOString());
                }
              } else {
                console.warn(`Invalid date calculation for medicine ${medicine.name}`);
                isSafe = true; // Default to safe if we can't calculate
              }
            } catch (error) {
              console.error(`Error calculating next dose time for ${medicine.name}:`, error);
              isSafe = true; // Default to safe if there's an error
            }
          } else {
            console.warn(`Invalid doseMinTime format for medicine ${medicine.name}: ${medicine.doseMinTime}`);
            isSafe = true; // Default to safe if format is invalid
          }
        }
      }
      
      // Calculate total amount given in last 24 hours
      const logsIn24Hours = medicineGroup.filter(log => 
        new Date(log.time).getTime() >= twentyFourHoursAgo.getTime()
      );
      
      const totalIn24Hours = logsIn24Hours.reduce((sum, log) => sum + log.doseAmount, 0);
      
      // Add to active doses
      doses.push({
        id: latestLog.id,
        medicineName: latestLog.medicine.name,
        doseAmount: latestLog.doseAmount,
        unitAbbr: latestLog.unitAbbr || latestLog.medicine.unitAbbr || undefined,
        time: typeof latestLog.time === 'string' ? latestLog.time : new Date(latestLog.time).toISOString(),
        nextDoseTime: nextDoseTime || "",
        isSafe,
        minutesRemaining: isSafe ? 0 : minutesRemaining,
        totalIn24Hours,
        doseMinTime
      });
    });
    
    return doses;
  }, [calculateDurationMinutes]);
  
  // Fetch active doses data
  const fetchActiveDoses = useCallback(async () => {
    if (!babyId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch medicine logs for this baby
      const response = await fetch(`/api/medicine-log?babyId=${babyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch medicine logs');
      }
      
      const data = await response.json();
      // Check if data is in the expected format
      const logsData = data.data || data;
      const processedDoses = createActiveDoses(Array.isArray(logsData) ? logsData : []);
      
      setActiveDoses(processedDoses);
    } catch (error) {
      console.error('Error fetching active doses:', error);
      setError('Failed to load active doses');
    } finally {
      setIsLoading(false);
    }
  }, [babyId, createActiveDoses]);
  
  // Set up interval to refresh countdown timers
  useEffect(() => {
    // Initial fetch
    fetchActiveDoses();
    
    // Set up timer to update every minute
    const timer = setInterval(() => {
      if (activeDoses.some(dose => !dose.isSafe)) {
        fetchActiveDoses();
      }
    }, 60000); // 1 minute
    
    return () => clearInterval(timer);
  }, [babyId, fetchActiveDoses]);
  
  // Refresh data when requested
  const handleRefresh = useCallback(() => {
    fetchActiveDoses();
  }, [fetchActiveDoses]);
  
  // Format time remaining for display
  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return 'Safe to administer';
    
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = Math.floor(minutes % 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m remaining`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  };
  

  
  return (
    <div className={cn(styles.tabContent, "medicine-form-tab-content")}>
      {/* Loading state */}
      {isLoading && (
        <div className={cn(styles.loadingContainer, "medicine-form-loading-container")}>
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-gray-600">Loading active doses...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className={cn(styles.errorContainer, "medicine-form-error-container")}>
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-2 text-red-500">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchActiveDoses} 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && activeDoses.length === 0 && (
        <div className={cn(styles.emptyState, "medicine-form-empty-state")}>
          <PillBottle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No medicine doses in the last 24 hours</p>
        </div>
      )}
      
      {/* Active doses list */}
      {!isLoading && !error && activeDoses.length > 0 && (
        <div className={cn(styles.activeDosesContainer, "medicine-form-active-doses-container")}>
          {activeDoses.map((dose) => (
            <div key={dose.id} className={cn(styles.doseCard, "medicine-form-dose-card")}>
              <div className={cn(styles.doseHeader, "medicine-form-dose-header")}>
                <div className="flex items-center">
                  <div className={cn(styles.iconContainer, "medicine-form-icon-container")}>
                    <PillBottle className="h-4 w-4" />
                  </div>
                  <h3 className={cn(styles.doseName, "medicine-form-dose-name ml-2")}>
                    {dose.medicineName}
                  </h3>
                </div>
                <span className={cn(styles.doseAmount, "medicine-form-dose-amount")}>
                  {dose.doseAmount} {dose.unitAbbr}
                </span>
              </div>
              
              <p className={cn(styles.doseTime, "medicine-form-dose-time")}>
                Last dose: {formatDate(dose.time)}
              </p>
              
              <div className={cn(styles.doseInfo, "medicine-form-dose-info mt-3")}>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span className={cn(
                    dose.isSafe ? styles.countdownSafe : styles.countdownWarning,
                    dose.isSafe ? "medicine-form-countdown-safe" : "medicine-form-countdown-warning"
                  )}>
                    {formatTimeRemaining(dose.minutesRemaining || 0)}
                  </span>
                </div>
              </div>
              
              <div className={cn(styles.totalDose, "medicine-form-total-dose mt-2")}>
                Total in last 24h: {dose.totalIn24Hours} {dose.unitAbbr}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveDosesTab;
