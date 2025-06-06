import { Settings } from '@prisma/client';
import { CardHeader } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import SleepForm from '@/src/components/forms/SleepForm';
import FeedForm from '@/src/components/forms/FeedForm';
import DiaperForm from '@/src/components/forms/DiaperForm';
import NoteForm from '@/src/components/forms/NoteForm';
import BathForm from '@/src/components/forms/BathForm';
import PumpForm from '@/src/components/forms/PumpForm';
import MilestoneForm from '@/src/components/forms/MilestoneForm';
import MeasurementForm from '@/src/components/forms/MeasurementForm';
import MedicineForm from '@/src/components/forms/MedicineForm';
import DailyStats from '@/src/components/DailyStats';
import { ActivityType, FilterType, TimelineProps } from './types';
import TimelineFilter from './TimelineFilter';
import TimelineActivityList from './TimelineActivityList';
import TimelineActivityDetails from './TimelineActivityDetails';
import { getActivityEndpoint, getActivityTime } from './utils';
import { PumpLogResponse } from '@/app/api/types';

const Timeline = ({ activities, onActivityDeleted }: TimelineProps) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [editModalType, setEditModalType] = useState<'sleep' | 'feed' | 'diaper' | 'medicine' | 'note' | 'bath' | 'pump' | 'milestone' | 'measurement' | null>(null);
  // Pagination removed as it breaks up view by day
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // State to store the activities fetched for the selected date
  const [dateFilteredActivities, setDateFilteredActivities] = useState<ActivityType[]>([]);
  
  // Loading state for fetching activities
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);

  const handleFormSuccess = () => {
    setEditModalType(null);
    setSelectedActivity(null);

    const babyId = activities.length > 0 ? activities[0].babyId : undefined;
    if (babyId) {
      fetchActivitiesForDate(babyId, selectedDate);
    }

    if (onActivityDeleted) {
      onActivityDeleted();
    }
  };
  
  // Function to fetch activities for a specific date
  const fetchActivitiesForDate = async (babyId: string, date: Date) => {
    try {
      // Format date for API request - ensure it's in ISO format
      const formattedDate = date.toISOString();
      
      console.log(`Fetching activities for date: ${formattedDate}`);
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // Get family ID from URL if available
      const urlPath = window.location.pathname;
      const familySlugMatch = urlPath.match(/^\/([^\/]+)\//);
      const familySlug = familySlugMatch ? familySlugMatch[1] : null;
      
      // Make the API call with the date parameter
      let url = `/api/timeline?babyId=${babyId}&date=${encodeURIComponent(formattedDate)}&_t=${timestamp}`;
      
      // The middleware will automatically add the family ID to the request headers
      // based on the family slug in the URL, so we don't need to add it explicitly
      console.log(`API URL: ${url}`);
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        console.log('Successfully fetched activities for date');
        const data = await response.json();
        if (data.success) {
          setDateFilteredActivities(data.data);
          console.log(`Received ${data.data.length} activities for date ${formattedDate}`);
          return data.data;
        } else {
          setDateFilteredActivities([]);
          console.log(`No activities found for date ${formattedDate}`);
          return [];
        }
      } else {
        console.error('Failed to fetch activities:', await response.text());
        setDateFilteredActivities([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching activities for date:', error);
      setDateFilteredActivities([]);
      return [];
    }
  };
  
  // Handle date selection and fetch data for the selected date
  const handleDateSelection = (newDate: Date) => {
    setSelectedDate(newDate);
    // Pagination removed as it breaks up view by day
    
    // Get the baby ID from the first activity if available
    const babyId = activities.length > 0 ? activities[0].babyId : null;
    
    if (babyId) {
      // Fetch data for the selected date
      fetchActivitiesForDate(babyId, newDate);
      
      // Notify parent that date has changed
      if (onActivityDeleted) {
        onActivityDeleted(newDate);
      }
    }
  };
  
  // Function to handle date navigation
  const handleDateChange = (days: number) => {
    // Calculate the new date
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    // Update the selected date
    handleDateSelection(newDate);
  };
  
  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    // When the component mounts or the selected date changes, fetch the activities for that date.
    const babyId = activities.length > 0 ? activities[0].babyId : null;
    if (babyId) {
      setIsLoadingActivities(true);
      fetchActivitiesForDate(babyId, selectedDate)
        .finally(() => setIsLoadingActivities(false));
    } else {
      // If there's no babyId (e.g., initial load with no activities),
      // we can use the activities from props directly.
      setDateFilteredActivities(activities);
    }
  }, [activities, selectedDate]); // Rerun when parent activities or selected date change.

  const sortedActivities = useMemo(() => {
    // Only use dateFilteredActivities, never fall back to activities from props
    const filtered = !activeFilter || activeFilter === null
      ? dateFilteredActivities
      : dateFilteredActivities.filter(activity => {
          switch (activeFilter) {
            case 'sleep':
              return 'duration' in activity;
            case 'feed':
              return 'amount' in activity;
            case 'diaper':
              return 'condition' in activity;
            case 'medicine':
              return 'doseAmount' in activity && 'medicineId' in activity;
            case 'note':
              return 'content' in activity;
            case 'bath':
              return 'soapUsed' in activity;
            case 'pump':
              return 'leftAmount' in activity || 'rightAmount' in activity;
            case 'milestone':
              return 'title' in activity && 'category' in activity;
            case 'measurement':
              return 'value' in activity && 'unit' in activity;
            default:
              return true;
          }
        });

    const sorted = [...filtered].sort((a, b) => {
      const timeA = new Date(getActivityTime(a));
      const timeB = new Date(getActivityTime(b));
      return timeB.getTime() - timeA.getTime();
    });

    return sorted;
  }, [dateFilteredActivities, activeFilter]);

  // Pagination removed as it breaks up view by day

  const handleDelete = async (activity: ActivityType) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    const endpoint = getActivityEndpoint(activity);
    try {
      const response = await fetch(`/api/${endpoint}?id=${activity.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSelectedActivity(null);
        onActivityDeleted?.();
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleEdit = (activity: ActivityType, type: 'sleep' | 'feed' | 'diaper' | 'medicine' | 'note' | 'bath' | 'pump' | 'milestone' | 'measurement') => {
    setSelectedActivity(activity);
    setEditModalType(type);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-192px)]">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 p-0">
        <TimelineFilter
          selectedDate={selectedDate}
          activeFilter={activeFilter}
          onDateChange={handleDateChange}
          onDateSelection={handleDateSelection}
          onFilterChange={setActiveFilter}
        />
      </CardHeader>

      {/* Daily Stats Banner */}
      <DailyStats 
        activities={dateFilteredActivities} 
        date={selectedDate} 
        isLoading={isLoadingActivities} 
      />

      {/* Activity List */}
      <TimelineActivityList
        activities={sortedActivities}
        settings={settings}
        isLoading={isLoadingActivities}
        onActivitySelect={setSelectedActivity}
        onSwipeLeft={Object.assign(() => handleDateChange(1), { activeFilter })} // Next day (swipe left) with activeFilter
        onSwipeRight={() => handleDateChange(-1)} // Previous day (swipe right)
      />

      {/* Activity Details */}
      <TimelineActivityDetails
        activity={selectedActivity}
        settings={settings}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

          {/* Edit Forms */}
      {selectedActivity && editModalType && (
        <>
          <SleepForm
            isOpen={editModalType === 'sleep'}
            onClose={() => setEditModalType(null)}
            babyId={selectedActivity.babyId}
            initialTime={getActivityTime(selectedActivity)}
            activity={'duration' in selectedActivity && 'type' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
            isSleeping={false}
            onSleepToggle={() => {}}
          />
          <FeedForm
            isOpen={editModalType === 'feed'}
            onClose={() => setEditModalType(null)}
            babyId={selectedActivity.babyId}
            initialTime={getActivityTime(selectedActivity)}
            activity={'amount' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
          />
          <DiaperForm
            isOpen={editModalType === 'diaper'}
            onClose={() => setEditModalType(null)}
            babyId={selectedActivity.babyId}
            initialTime={getActivityTime(selectedActivity)}
            activity={'condition' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
          />
          <NoteForm
            isOpen={editModalType === 'note'}
            onClose={() => setEditModalType(null)}
            babyId={selectedActivity.babyId}
            initialTime={getActivityTime(selectedActivity)}
            activity={'content' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
            familyId={
              'familyId' in selectedActivity ? (selectedActivity as any).familyId : undefined
            }
          />
          <BathForm
            isOpen={editModalType === 'bath'}
            onClose={() => setEditModalType(null)}
            babyId={selectedActivity.babyId}
            initialTime={getActivityTime(selectedActivity)}
            activity={'soapUsed' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
          />
          <PumpForm
            isOpen={editModalType === 'pump'}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={'startTime' in selectedActivity && selectedActivity.startTime ? String(selectedActivity.startTime) : getActivityTime(selectedActivity)}
            activity={
              ('leftAmount' in selectedActivity || 'rightAmount' in selectedActivity) ? 
                (selectedActivity as unknown as PumpLogResponse) : 
                undefined
            }
            onSuccess={handleFormSuccess}
          />
          <MilestoneForm
            isOpen={editModalType === 'milestone'}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={'date' in selectedActivity && selectedActivity.date ? String(selectedActivity.date) : getActivityTime(selectedActivity)}
            activity={'title' in selectedActivity && 'category' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
          />
          <MeasurementForm
            isOpen={editModalType === 'measurement'}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={'date' in selectedActivity && selectedActivity.date ? String(selectedActivity.date) : getActivityTime(selectedActivity)}
            activity={'value' in selectedActivity && 'unit' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
          />
          <MedicineForm
            isOpen={editModalType === 'medicine'}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={'doseAmount' in selectedActivity && 'time' in selectedActivity ? String(selectedActivity.time) : getActivityTime(selectedActivity)}
            activity={'doseAmount' in selectedActivity && 'medicineId' in selectedActivity ? selectedActivity : undefined}
            onSuccess={handleFormSuccess}
          />
        </>
      )}
    </div>
  );
};

export default Timeline;
