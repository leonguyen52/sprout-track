import { Settings } from '@prisma/client';
import { CardHeader } from '@/src/components/ui/card';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Remove internal activity state management - use activities from parent
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);
  const [isFetchAnimated, setIsFetchAnimated] = useState<boolean>(true);

  const babyId = useMemo(() => (activities.length > 0 ? activities[0].babyId : undefined), [activities]);

  // Remove fetchActivitiesForDate - parent component handles data fetching

  const handleFormSuccess = () => {
    setEditModalType(null);
    setSelectedActivity(null);

    if (onActivityDeleted) {
      onActivityDeleted();
    }
  };

  const handleDateSelection = (newDate: Date) => {
    setSelectedDate(newDate);
    if (onActivityDeleted) {
      onActivityDeleted(newDate);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    handleDateSelection(newDate);
  };
  
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
  
  // Remove periodic refresh logic - parent component handles data fetching

  const sortedActivities = useMemo(() => {
    const filtered = !activeFilter || activeFilter === null
      ? activities
      : activities.filter(activity => {
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
  }, [activities, activeFilter]);

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
        activities={activities} 
        date={selectedDate} 
        isLoading={isLoadingActivities} 
      />

      {/* Activity List */}
      <TimelineActivityList
        activities={sortedActivities}
        settings={settings}
        isLoading={isLoadingActivities}
        isAnimated={isFetchAnimated}
        onActivitySelect={(activity) => setSelectedActivity(activity)}
        onSwipeLeft={() => handleDateChange(1)}
        onSwipeRight={() => handleDateChange(-1)}
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
