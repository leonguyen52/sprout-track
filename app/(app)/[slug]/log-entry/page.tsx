'use client';

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import '../../../(app)/[slug]/log-entry/no-activities.css';
import { SleepLogResponse, FeedLogResponse, DiaperLogResponse, NoteResponse, BathLogResponse, PumpLogResponse, MeasurementResponse, MilestoneResponse, MedicineLogResponse } from '@/app/api/types';
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { StatusBubble } from "@/src/components/ui/status-bubble";
import { Baby as BabyIcon } from 'lucide-react';
import Timeline from '@/src/components/Timeline';
import SettingsModal from '@/src/components/modals/SettingsModal';
import { useBaby } from '../../../context/baby';
import { useTimezone } from '../../../context/timezone';
import { useFamily } from '@/src/context/family';
import { ActivityType } from '@/src/components/ui/activity-tile';
import { ActivityTileGroup } from '@/src/components/ActivityTileGroup';
import SleepForm from '@/src/components/forms/SleepForm';
import FeedForm from '@/src/components/forms/FeedForm';
import DiaperForm from '@/src/components/forms/DiaperForm';
import NoteForm from '@/src/components/forms/NoteForm';
import BathForm from '@/src/components/forms/BathForm';
import PumpForm from '@/src/components/forms/PumpForm';
import MeasurementForm from '@/src/components/forms/MeasurementForm';
import MilestoneForm from '@/src/components/forms/MilestoneForm';
import MedicineForm from '@/src/components/forms/MedicineForm';
import { useParams } from 'next/navigation';

function HomeContent(): React.ReactElement {
  const { selectedBaby, sleepingBabies, setSleepingBabies } = useBaby();
  const { userTimezone } = useTimezone();
  const { family } = useFamily();
  const params = useParams();
  const familySlug = params?.slug as string;
  
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showDiaperModal, setShowDiaperModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showBathModal, setShowBathModal] = useState(false);
  const [showPumpModal, setShowPumpModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [localTime, setLocalTime] = useState<string>('');
  const lastSleepCheck = useRef<string>('');
  const [sleepStartTime, setSleepStartTime] = useState<Record<string, Date>>({});
  const [lastSleepEndTime, setLastSleepEndTime] = useState<Record<string, Date>>({});
  const [lastFeedTime, setLastFeedTime] = useState<Record<string, Date>>({});
  const [lastDiaperTime, setLastDiaperTime] = useState<Record<string, Date>>({});

  // Track the currently selected date in the Timeline component
  const [selectedTimelineDate, setSelectedTimelineDate] = useState<Date | null>(null);
  
  const [sleepData, setSleepData] = useState<{
    ongoingSleep?: SleepLogResponse;
    lastEndedSleep?: SleepLogResponse & { endTime: string };
  }>({});

  // Define checkSleepStatus before it's used
  const checkSleepStatus = useCallback(async (babyId: string) => {
    // Prevent duplicate checks
    const checkId = `${babyId}-${Date.now()}`;
    if (lastSleepCheck.current === checkId) return;
    lastSleepCheck.current = checkId;

    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // Add family ID to the request if available
      let url = `/api/timeline?babyId=${babyId}&limit=200&_t=${timestamp}&timezone=${encodeURIComponent(userTimezone)}`;
      if (family?.id) {
        url += `&familyId=${family.id}`;
      }
      
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Expires': '0',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });
      if (!response.ok) return;
      
      const data = await response.json();
      if (!data.success) return;
      
    // Filter for sleep logs only - ensure we only get sleep activities, not pump activities
    const sleepLogs = data.data
      .filter((activity: ActivityType): activity is SleepLogResponse => 
        'duration' in activity && 'startTime' in activity && 
        'type' in activity && (activity.type === 'NAP' || activity.type === 'NIGHT_SLEEP')
      );
      
      // Find ongoing sleep
      const ongoingSleep = sleepLogs.find((log: SleepLogResponse) => !log.endTime);
      
      // Find last ended sleep
      const completedSleeps = sleepLogs
        .filter((log: SleepLogResponse): log is SleepLogResponse & { endTime: string } => 
          log.endTime !== null && typeof log.endTime === 'string'
        )
        .sort((a: SleepLogResponse & { endTime: string }, b: SleepLogResponse & { endTime: string }) => 
          new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
        );
      
      setSleepData({
        ongoingSleep,
        lastEndedSleep: completedSleeps[0]
      });
    } catch (error) {
      console.error('Error checking sleep status:', error);
    }
  }, [userTimezone, family]);
  
  const refreshActivities = useCallback(async (babyId: string | undefined, dateFilter?: Date) => {
    if (!babyId) return;
    
    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // If a date filter is provided, use it in the API call
      let url = `/api/timeline?babyId=${babyId}&limit=200&_t=${timestamp}&timezone=${encodeURIComponent(userTimezone)}`;
      
      // Add family ID to the request if available
      if (family?.id) {
        url += `&familyId=${family.id}`;
      }
      
      if (dateFilter) {
        // Update the selected date
        setSelectedTimelineDate(dateFilter);
        url += `&date=${encodeURIComponent(dateFilter.toISOString())}`;
        console.log(`Refreshing activities with date filter: ${dateFilter.toISOString()}`);
      } else if (selectedTimelineDate) {
        // If we have a previously selected date, use it
        url += `&date=${encodeURIComponent(selectedTimelineDate.toISOString())}`;
        console.log(`Refreshing activities with previous date filter: ${selectedTimelineDate.toISOString()}`);
      } else {
        console.log(`Refreshing activities without date filter`);
      }
      
      // Fetch timeline data
      const authToken = localStorage.getItem('authToken');
      const timelineResponse = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Expires': '0',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });
      const timelineData = await timelineResponse.json();
      
      if (timelineData.success) {
        setActivities(timelineData.data);

        // Update last feed time
        const lastFeed = timelineData.data
          .filter((activity: ActivityType) => 'amount' in activity)
          .sort((a: FeedLogResponse, b: FeedLogResponse) => 
            new Date(b.time).getTime() - new Date(a.time).getTime()
          )[0];
        if (lastFeed) {
          setLastFeedTime(prev => ({
            ...prev,
            [babyId]: new Date(lastFeed.time)
          }));
        }

        // Update last diaper time
        const lastDiaper = timelineData.data
          .filter((activity: ActivityType) => 'condition' in activity)
          .sort((a: DiaperLogResponse, b: DiaperLogResponse) => 
            new Date(b.time).getTime() - new Date(a.time).getTime()
          )[0];
        if (lastDiaper) {
          setLastDiaperTime(prev => ({
            ...prev,
            [babyId]: new Date(lastDiaper.time)
          }));
        }
        
        // Update last sleep end time - only consider sleep activities
        const completedSleeps = timelineData.data
          .filter((activity: ActivityType): activity is SleepLogResponse & { endTime: string } => 
            'duration' in activity && 'startTime' in activity && 
            'type' in activity && (activity.type === 'NAP' || activity.type === 'NIGHT_SLEEP') &&
            activity.endTime !== null && typeof activity.endTime === 'string'
          )
          .sort((a: SleepLogResponse & { endTime: string }, b: SleepLogResponse & { endTime: string }) => 
            new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
          );
        
        if (completedSleeps.length > 0) {
          setLastSleepEndTime(prev => ({
            ...prev,
            [babyId]: new Date(completedSleeps[0].endTime)
          }));
        }
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
    }
  }, [userTimezone, selectedTimelineDate, family]);

  // Update unlock timer on any activity
  const updateUnlockTimer = () => {
    const unlockTime = localStorage.getItem('unlockTime');
    if (unlockTime) {
      localStorage.setItem('unlockTime', Date.now().toString());
    }
  };

  useEffect(() => {
    // Set initial time
    const now = new Date();
    setLocalTime(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

    // Update time every minute
    const interval = setInterval(() => {
      const now = new Date();
      setLocalTime(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 60000);

    // Add listeners for user activity
    window.addEventListener('click', updateUnlockTimer);
    window.addEventListener('keydown', updateUnlockTimer);
    window.addEventListener('mousemove', updateUnlockTimer);
    window.addEventListener('touchstart', updateUnlockTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', updateUnlockTimer);
      window.removeEventListener('keydown', updateUnlockTimer);
      window.removeEventListener('mousemove', updateUnlockTimer);
      window.removeEventListener('touchstart', updateUnlockTimer);
    };
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      if (selectedBaby?.id) {
        await refreshActivities(selectedBaby.id);
        await checkSleepStatus(selectedBaby.id);
      }
    };
    
    initializeData();
  }, [selectedBaby, refreshActivities, checkSleepStatus]);

  // Handle sleep status changes
  useEffect(() => {
    if (!selectedBaby?.id) return;

    const { ongoingSleep, lastEndedSleep } = sleepData;
    
    if (ongoingSleep) {
      setSleepingBabies((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.add(selectedBaby.id);
        return newSet;
      });
      setSleepStartTime((prev: Record<string, Date>) => ({
        ...prev,
        [selectedBaby.id]: new Date(ongoingSleep.startTime)
      }));
    } else {
      setSleepingBabies((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(selectedBaby.id);
        return newSet;
      });
      setSleepStartTime((prev: Record<string, Date>) => {
        const newState = { ...prev };
        delete newState[selectedBaby.id];
        return newState;
      });
      
      if (lastEndedSleep) {
        setLastSleepEndTime(prev => ({
          ...prev,
          [selectedBaby.id]: new Date(lastEndedSleep.endTime)
        }));
      }
    }
  }, [sleepData, selectedBaby]);

  return (
    <div className="relative isolate">
      {/* Activity Tile Group */}
      {selectedBaby?.id && (
        <ActivityTileGroup
          selectedBaby={selectedBaby}
          sleepingBabies={sleepingBabies}
          sleepStartTime={sleepStartTime}
          lastSleepEndTime={lastSleepEndTime}
          lastFeedTime={lastFeedTime}
          lastDiaperTime={lastDiaperTime}
          updateUnlockTimer={updateUnlockTimer}
          onSleepClick={() => setShowSleepModal(true)}
          onFeedClick={() => setShowFeedModal(true)}
          onDiaperClick={() => setShowDiaperModal(true)}
          onNoteClick={() => setShowNoteModal(true)}
          onBathClick={() => setShowBathModal(true)}
          onPumpClick={() => setShowPumpModal(true)}
          onMeasurementClick={() => setShowMeasurementModal(true)}
          onMilestoneClick={() => setShowMilestoneModal(true)}
          onMedicineClick={() => setShowMedicineModal(true)}
        />
      )}

      {/* Timeline Section */}
      {selectedBaby && (
        <Card className="overflow-hidden border-0 relative z-0">
          {activities.length > 0 ? (
            <Timeline 
              activities={activities} 
              onActivityDeleted={(dateFilter?: Date) => {
                if (selectedBaby?.id) {
                  // If a date filter is provided, use it when refreshing activities
                  if (dateFilter) {
                    console.log(`Refreshing with date filter: ${dateFilter.toISOString()}`);
                    // Don't call refreshActivities here, let the Timeline component handle it
                  } else {
                    refreshActivities(selectedBaby.id);
                  }
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-192px)] text-center bg-white border-t border-gray-200 no-activities-container">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center no-activities-icon-container">
                <BabyIcon className="h-8 w-8 text-indigo-600 no-activities-icon" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1 no-activities-title">No activities recorded</h3>
              <p className="text-sm text-gray-500 no-activities-text">
                Activities will appear here once you start tracking
              </p>
            </div>
          )}
        </Card>
      )}

      {/* No Baby Selected Screen */}
      {!selectedBaby && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">No Baby Selected</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Please select a baby from the dropdown menu above.</p>
        </div>
      )}

      {/* Forms */}
      {/* Sleep Form */}
      <SleepForm
        isOpen={showSleepModal}
        onClose={async () => {
          setShowSleepModal(false);
        }}
        isSleeping={selectedBaby?.id ? sleepingBabies.has(selectedBaby.id) : false}
        onSleepToggle={() => {
          if (selectedBaby?.id) {
            setSleepingBabies((prev: Set<string>) => {
              const newSet = new Set(prev);
              if (newSet.has(selectedBaby.id)) {
                newSet.delete(selectedBaby.id);
              } else {
                newSet.add(selectedBaby.id);
              }
              return newSet;
            });
          }
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={async () => {
          if (selectedBaby?.id) {
            await refreshActivities(selectedBaby.id);
            await checkSleepStatus(selectedBaby.id);
          }
        }}
      />
      
      {/* Feed Form */}
      <FeedForm
        isOpen={showFeedModal}
        onClose={() => {
          setShowFeedModal(false);
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Diaper Form */}
      <DiaperForm
        isOpen={showDiaperModal}
        onClose={() => {
          setShowDiaperModal(false);
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Note Form */}
      <NoteForm
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Bath Form */}
      <BathForm
        isOpen={showBathModal}
        onClose={() => {
          setShowBathModal(false);
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Pump Form */}
      <PumpForm
        isOpen={showPumpModal}
        onClose={() => {
          setShowPumpModal(false);
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Measurement Form */}
      <MeasurementForm
        isOpen={showMeasurementModal}
        onClose={() => {
          setShowMeasurementModal(false);
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Milestone Form */}
      <MilestoneForm
        isOpen={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false);
        }}
        babyId={selectedBaby?.id || ''}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Medicine Form */}
      <MedicineForm
        isOpen={showMedicineModal}
        onClose={() => {
          setShowMedicineModal(false);
        }}
        babyId={selectedBaby?.id}
        initialTime={localTime}
        onSuccess={() => {
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        open={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          if (selectedBaby?.id) {
            refreshActivities(selectedBaby.id);
          }
        }}
        variant="settings"
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
