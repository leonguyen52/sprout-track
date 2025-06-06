import { Button } from '@/src/components/ui/button';
import { Baby as BabyIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ActivityType, TimelineActivityListProps, FilterType } from './types';
import { getActivityIcon, getActivityStyle, getActivityDescription } from './utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/src/context/theme';
import './timeline-activity-list.css';

const TimelineActivityList = ({
  activities,
  settings,
  isLoading,
  isAnimated = true,
  itemsPerPage,
  currentPage,
  totalPages,
  onActivitySelect,
  onPageChange,
  onItemsPerPageChange,
  onSwipeLeft,
  onSwipeRight,
}: TimelineActivityListProps) => {
  // Extract activeFilter from props if available
  const activeFilter = (onSwipeLeft as any)?.activeFilter as FilterType | undefined;
  
  // Filter activities based on the activeFilter
  const filteredActivities = useMemo(() => {
    if (!activeFilter || activeFilter === null) {
      return activities;
    }
    
    return activities.filter(activity => {
      switch (activeFilter) {
        case 'sleep':
          return 'duration' in activity;
        case 'feed':
          return 'amount' in activity;
        case 'diaper':
          return 'condition' in activity;
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
  }, [activities, activeFilter]);
  const { theme } = useTheme();
  
  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0); // 0-1 value representing swipe progress
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Required minimum distance traveled to be considered a swipe
  const minSwipeDistance = 50;
  // Maximum distance to consider for full shadow effect
  const maxSwipeDistance = 150;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeProgress(0);
    // Add a subtle haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate swipe distance and direction
    const distance = touchStart - currentTouch;
    const absDistance = Math.abs(distance);
    
    // Calculate progress as a value between 0 and 1
    const progress = Math.min(absDistance / maxSwipeDistance, 1);
    setSwipeProgress(progress);
    
    // Determine swipe direction
    if (distance > 0) {
      setSwipeDirection('left');
    } else if (distance < 0) {
      setSwipeDirection('right');
    }
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    if (isSwipe) {
      if (distance > 0) {
        // Swiped left (next day)
        onSwipeLeft?.();
      } else {
        // Swiped right (previous day)
        onSwipeRight?.();
      }
    }
    
    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeDirection(null);
    setSwipeProgress(0);
  };
  
  // Reset when activities change
  useEffect(() => {
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeDirection(null);
    setSwipeProgress(0);
  }, [activities]);
  return (
    <>
      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto relative bg-white timeline-activity-scroll-container" 
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
      {/* Visual swipe shadow effect */}
      {swipeProgress > 0 && (
        <>
          {/* Left shadow (for right swipe - previous day) */}
          {swipeDirection === 'right' && (
            <div 
              className="absolute inset-y-0 left-0 pointer-events-none z-10 bg-gradient-to-r from-gray-400/50 to-transparent timeline-swipe-shadow-left"
              style={{ 
                width: `${swipeProgress * 30}%`, 
                opacity: swipeProgress * 0.7
              }}
            >
            </div>
          )}
          
          {/* Right shadow (for left swipe - next day) */}
          {swipeDirection === 'left' && (
            <div 
              className="absolute inset-y-0 right-0 pointer-events-none z-10 bg-gradient-to-l from-gray-400/50 to-transparent timeline-swipe-shadow-right"
              style={{ 
                width: `${swipeProgress * 30}%`, 
                opacity: swipeProgress * 0.7
              }}
            >
            </div>
          )}
        </>
      )}
        
        {/* Activity List */}
        <div className="divide-y divide-gray-100 min-h-full bg-white relative timeline-activity-list">
          {activities.length > 0 ? (
            <AnimatePresence>
              {filteredActivities.map((activity, index) => {
                const style = getActivityStyle(activity);
                const description = getActivityDescription(activity, settings);
                return (
                  <motion.div
                    key={activity.id}
                    className="group hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer timeline-activity-item"
                    onClick={() => onActivitySelect(activity)}
                    initial={isAnimated ? { opacity: 0, y: -50, scale: 0.95 } : false}
                    animate={isAnimated ? { opacity: 1, y: 0, scale: 1 } : false}
                    transition={isAnimated ? {
                      delay: index * 0.05,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200,
                      damping: 25
                    } : { duration: 0 }}
                  >
                    <div className="flex items-center px-6 py-3">
                      <div className={`flex-shrink-0 ${style.bg} p-2 rounded-xl mr-4`}>
                        {getActivityIcon(activity)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 timeline-activity-type`}>
                            {description.type}
                          </span>
                          <span className="text-gray-900 timeline-activity-details">{description.details}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center h-full">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BabyIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 timeline-empty-state">No activities recorded</h3>
                <p className="text-sm text-gray-500 timeline-empty-description">
                  Activities will appear here once you start tracking
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Loading State - positioned the same way as the empty state */}
        {isLoading && activities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center h-full">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1 timeline-empty-state">Loading activities...</h3>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls removed as it breaks up view by day */}
    </>
  );
};

export default TimelineActivityList;