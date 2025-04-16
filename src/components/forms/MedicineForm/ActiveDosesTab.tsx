'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { ActiveDosesTabProps, MedicineLogWithDetails, ActiveDose } from './medicine-form.types';
import { PillBottle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { StatusBubble } from '@/src/components/ui/status-bubble';
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
  const processActiveDoses = useCallback((medicineLogs: MedicineLogWithDetails[]) => {
    // Group logs by medicine ID
    const medicineGroups: Record<string, MedicineLogWithDetails[]> = {};
    
    medicineLogs.forEach(log => {
      if (!medicineGroups[log.medicineId]) {
        medicineGroups[log.medicineId] = [];
      }
      medicineGroups[log.medicineId].push(log);
    });
    
    // Process each medicine group
    const now = new Date();
    const doses: ActiveDose[] = [];
    
    Object.entries(medicineGroups).forEach(([medicineId, logs]) => {
      // Sort logs by time (newest first)
      logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      // Get the most recent log
      const latestLog = logs[0];
      
      // Calculate when next dose is safe (if doseMinTime is set)
      let isSafe = true;
      let minutesRemaining = 0;
      let nextDoseTime: string | undefined = undefined;
      
      if (latestLog.medicine.doseMinTime) {
        const [hours, minutes] = latestLog.medicine.doseMinTime.split(':').map(Number);
        const minTimeMinutes = hours * 60 + minutes;
        
        // Calculate time elapsed since last dose
        const logTime = new Date(latestLog.time);
        minutesRemaining = minTimeMinutes - calculateDurationMinutes(logTime.toISOString(), now.toISOString());
        
        // Determine if it's safe to give another dose
        isSafe = minutesRemaining <= 0;
        
        // Calculate next safe dose time
        if (!isSafe) {
          const nextTime = new Date(logTime);
          nextTime.setMinutes(nextTime.getMinutes() + minTimeMinutes);
          nextDoseTime = nextTime.toISOString();
        }
      }
      
      // Calculate total amount given in last 24 hours
      const twentyFourHoursAgo = new Date(now);
      twentyFourHoursAgo.setHours(now.getHours() - 24);
      
      const logsIn24Hours = logs.filter(log => 
        new Date(log.time).getTime() >= twentyFourHoursAgo.getTime()
      );
      
      const totalIn24Hours = logsIn24Hours.reduce((sum, log) => sum + log.doseAmount, 0);
      
      // Add to active doses
      doses.push({
        id: latestLog.id,
        medicineName: latestLog.medicine.name,
        doseAmount: latestLog.doseAmount,
        unitAbbr: latestLog.unitAbbr || latestLog.medicine.unitAbbr,
        time: latestLog.time,
        nextDoseTime,
        isSafe,
        minutesRemaining: isSafe ? 0 : minutesRemaining,
        totalIn24Hours
      });
    });
    
    return doses;
  }, [calculateDurationMinutes]);
  
  // Fetch active doses data
  const fetchActiveDoses = useCallback(async () => {
    if (!babyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current date in YYYY-MM-DD format
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0] + 'T23:59:59';
      
      // Fetch medicine logs for the past 24 hours
      const response = await fetch(`/api/medicine-log?babyId=${babyId}&startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch medicine logs');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const processedDoses = processActiveDoses(data.data);
        setActiveDoses(processedDoses);
      } else {
        setError(data.error || 'Failed to load medicine logs');
      }
    } catch (err) {
      console.error('Error fetching medicine logs:', err);
      setError('Failed to load medicine logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [babyId, processActiveDoses]);
  
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
  useEffect(() => {
    fetchActiveDoses();
  }, [refreshData, fetchActiveDoses]);
  
  // Format time remaining for display
  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return 'Safe to administer';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  };
  
  // Determine status for StatusBubble
  const getDoseStatus = (isSafe: boolean, minutesRemaining?: number): string => {
    if (isSafe) return 'Safe';
    if (!minutesRemaining) return 'Unknown';
    
    if (minutesRemaining <= 15) return 'Almost Safe';
    return 'Waiting';
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
                
                <StatusBubble 
                  status={getDoseStatus(dose.isSafe, dose.minutesRemaining)}
                  startTime={dose.isSafe ? undefined : dose.time}
                  warningTime={dose.medicine?.doseMinTime}
                  className="ml-2"
                />
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
