import React, { useState, useEffect } from 'react';
import { BreastSide } from '@prisma/client';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Play, Pause, Clock } from 'lucide-react';

interface BreastFeedFormProps {
  side: BreastSide | '';
  leftDuration: number;
  rightDuration: number;
  activeBreast: 'LEFT' | 'RIGHT' | '';
  isTimerRunning: boolean;
  loading: boolean;
  onSideChange: (side: BreastSide | '') => void;
  onTimerStart: (breast: 'LEFT' | 'RIGHT') => void;
  onTimerStop: () => void;
  onDurationChange: (breast: 'LEFT' | 'RIGHT', seconds: number) => void;
  isEditing?: boolean; // New prop to indicate if we're editing an existing record
}

// Extract hours, minutes, seconds from total seconds
const extractTimeComponents = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds };
};

// Format time as hh:mm:ss
const formatTime = (seconds: number) => {
  const { hours, minutes, seconds: secs } = extractTimeComponents(seconds);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

export default function BreastFeedForm({
  side,
  leftDuration,
  rightDuration,
  activeBreast,
  isTimerRunning,
  loading,
  onSideChange,
  onTimerStart,
  onTimerStop,
  onDurationChange,
  isEditing = false, // Default to false
}: BreastFeedFormProps) {
  const [isEditingLeft, setIsEditingLeft] = useState(false);
  const [isEditingRight, setIsEditingRight] = useState(false);
  
  // Timer start times for calculating elapsed duration
  const [leftStartTime, setLeftStartTime] = useState<number | null>(null);
  const [rightStartTime, setRightStartTime] = useState<number | null>(null);
  
  // Base durations when timer starts (to avoid feedback loop)
  const [leftBaseDuration, setLeftBaseDuration] = useState(leftDuration);
  const [rightBaseDuration, setRightBaseDuration] = useState(rightDuration);
  
  // Current displayed durations (updated by timer)
  const [displayLeftDuration, setDisplayLeftDuration] = useState(leftDuration);
  const [displayRightDuration, setDisplayRightDuration] = useState(rightDuration);
  
  // Local state for editing
  const [leftHours, setLeftHours] = useState(0);
  const [leftMinutes, setLeftMinutes] = useState(0);
  const [leftSeconds, setLeftSeconds] = useState(0);
  
  const [rightHours, setRightHours] = useState(0);
  const [rightMinutes, setRightMinutes] = useState(0);
  const [rightSeconds, setRightSeconds] = useState(0);
  
  // Update display durations when props change (only when not timing)
  useEffect(() => {
    if (!leftStartTime) {
      setDisplayLeftDuration(leftDuration);
      setLeftBaseDuration(leftDuration);
    }
  }, [leftDuration, leftStartTime]);
  
  useEffect(() => {
    if (!rightStartTime) {
      setDisplayRightDuration(rightDuration);
      setRightBaseDuration(rightDuration);
    }
  }, [rightDuration, rightStartTime]);
  
  // Update local state when durations change
  useEffect(() => {
    if (!isEditingLeft) {
      const { hours, minutes, seconds } = extractTimeComponents(displayLeftDuration);
      setLeftHours(hours);
      setLeftMinutes(minutes);
      setLeftSeconds(seconds);
    }
  }, [displayLeftDuration, isEditingLeft]);
  
  useEffect(() => {
    if (!isEditingRight) {
      const { hours, minutes, seconds } = extractTimeComponents(displayRightDuration);
      setRightHours(hours);
      setRightMinutes(minutes);
      setRightSeconds(seconds);
    }
  }, [displayRightDuration, isEditingRight]);
  
  // Timer effect that updates display durations based on start times
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning && (leftStartTime || rightStartTime)) {
      interval = setInterval(() => {
        const now = Date.now();
        
        if (leftStartTime && activeBreast === 'LEFT') {
          const elapsedSeconds = Math.floor((now - leftStartTime) / 1000);
          const newDuration = leftBaseDuration + elapsedSeconds;
          setDisplayLeftDuration(newDuration);
        }
        
        if (rightStartTime && activeBreast === 'RIGHT') {
          const elapsedSeconds = Math.floor((now - rightStartTime) / 1000);
          const newDuration = rightBaseDuration + elapsedSeconds;
          setDisplayRightDuration(newDuration);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, leftStartTime, rightStartTime, activeBreast, leftBaseDuration, rightBaseDuration]);
  
  // Handle visibility change to recalculate elapsed time when returning to the app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTimerRunning) {
        const now = Date.now();
        
        if (leftStartTime && activeBreast === 'LEFT') {
          const elapsedSeconds = Math.floor((now - leftStartTime) / 1000);
          const newDuration = leftBaseDuration + elapsedSeconds;
          setDisplayLeftDuration(newDuration);
        }
        
        if (rightStartTime && activeBreast === 'RIGHT') {
          const elapsedSeconds = Math.floor((now - rightStartTime) / 1000);
          const newDuration = rightBaseDuration + elapsedSeconds;
          setDisplayRightDuration(newDuration);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTimerRunning, leftStartTime, rightStartTime, activeBreast, leftBaseDuration, rightBaseDuration]);
  
  // Handle saving edited duration
  const saveLeftDuration = () => {
    const totalSeconds = (leftHours * 3600) + (leftMinutes * 60) + leftSeconds;
    setDisplayLeftDuration(totalSeconds);
    onDurationChange('LEFT', totalSeconds);
    setIsEditingLeft(false);
  };
  
  const saveRightDuration = () => {
    const totalSeconds = (rightHours * 3600) + (rightMinutes * 60) + rightSeconds;
    setDisplayRightDuration(totalSeconds);
    onDurationChange('RIGHT', totalSeconds);
    setIsEditingRight(false);
  };
  
  // Handle timer start with timestamp tracking
  const handleTimerStart = (breast: 'LEFT' | 'RIGHT') => {
    const now = Date.now();
    
    if (breast === 'LEFT') {
      setLeftStartTime(now);
      setLeftBaseDuration(leftDuration); // Set base duration when starting
    } else {
      setRightStartTime(now);
      setRightBaseDuration(rightDuration); // Set base duration when starting
    }
    
    onTimerStart(breast);
  };
  
  // Handle timer stop
  const handleTimerStop = () => {
    // Calculate final durations before stopping
    const now = Date.now();
    
    if (leftStartTime && activeBreast === 'LEFT') {
      const elapsedSeconds = Math.floor((now - leftStartTime) / 1000);
      const finalDuration = leftBaseDuration + elapsedSeconds;
      setDisplayLeftDuration(finalDuration);
      onDurationChange('LEFT', finalDuration);
      setLeftStartTime(null);
    }
    
    if (rightStartTime && activeBreast === 'RIGHT') {
      const elapsedSeconds = Math.floor((now - rightStartTime) / 1000);
      const finalDuration = rightBaseDuration + elapsedSeconds;
      setDisplayRightDuration(finalDuration);
      onDurationChange('RIGHT', finalDuration);
      setRightStartTime(null);
    }
    
    onTimerStop();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, saveFn: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveFn();
    }
  };
  
  // Validate and handle input changes
  const handleTimeInputChange = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setter(0);
    } else {
      setter(Math.min(Math.max(0, numValue), max));
    }
  };
  
  return (
    <>
      <div>
        <label className="form-label">Side</label>
        <div className="flex justify-between items-center gap-3 mt-2">
          <Button
            type="button"
            onClick={() => {
              const newSide = side === 'LEFT' ? '' : 'LEFT';
              onSideChange(newSide as BreastSide | '');
            }}
            disabled={loading}
            variant={side === 'LEFT' ? 'default' : 'outline'}
            className="w-full"
          >
            Left
          </Button>
          
          <Button
            type="button"
            onClick={() => {
              const newSide = side === 'RIGHT' ? '' : 'RIGHT';
              onSideChange(newSide as BreastSide | '');
            }}
            disabled={loading}
            variant={side === 'RIGHT' ? 'default' : 'outline'}
            className="w-full"
          >
            Right
          </Button>
        </div>
      </div>
      
      <div>
        <label className="form-label">Duration</label>
        <div className="flex flex-col space-y-4">
          {/* Left Breast Timer */}
          {side === 'LEFT' && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-lg"></span>
                {isEditingLeft ? (
                  <div className="flex items-center space-x-1">
                    <Input
                      type="number"
                      value={leftHours}
                      onChange={(e) => handleTimeInputChange(e.target.value, setLeftHours, 23)}
                      onKeyDown={(e) => handleKeyDown(e, saveLeftDuration)}
                      className="w-20 text-center"
                      min="0"
                      max="23"
                      disabled={loading}
                    />
                    <span className="text-lg">:</span>
                    <Input
                      type="number"
                      value={leftMinutes}
                      onChange={(e) => handleTimeInputChange(e.target.value, setLeftMinutes, 59)}
                      onKeyDown={(e) => handleKeyDown(e, saveLeftDuration)}
                      className="w-20 text-center"
                      min="0"
                      max="59"
                      disabled={loading}
                    />
                    <span className="text-lg">:</span>
                    <Input
                      type="number"
                      value={leftSeconds}
                      onChange={(e) => handleTimeInputChange(e.target.value, setLeftSeconds, 59)}
                      onKeyDown={(e) => handleKeyDown(e, saveLeftDuration)}
                      className="w-20 text-center"
                      min="0"
                      max="59"
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-medium tracking-wider">
                    {formatTime(displayLeftDuration)}
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-3">
                {isEditingLeft ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      saveLeftDuration();
                    }}
                    disabled={loading}
                  >
                    Save
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isTimerRunning) handleTimerStop();
                      setIsEditingLeft(true);
                    }}
                    disabled={loading}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (isTimerRunning && activeBreast === 'LEFT') {
                      handleTimerStop();
                    } else {
                      handleTimerStop(); // Stop any existing timer
                      setIsEditingLeft(false); // Exit edit mode if active
                      handleTimerStart('LEFT');
                    }
                  }}
                  disabled={loading || isEditingLeft}
                >
                  {isTimerRunning && activeBreast === 'LEFT' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isTimerRunning && activeBreast === 'LEFT' ? 'Pause' : 'Start'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Right Breast Timer */}
          {side === 'RIGHT' && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-lg"></span>
                {isEditingRight ? (
                  <div className="flex items-center space-x-1">
                    <Input
                      type="number"
                      value={rightHours}
                      onChange={(e) => handleTimeInputChange(e.target.value, setRightHours, 23)}
                      onKeyDown={(e) => handleKeyDown(e, saveRightDuration)}
                      className="w-20 text-center"
                      min="0"
                      max="23"
                      disabled={loading}
                    />
                    <span className="text-lg">:</span>
                    <Input
                      type="number"
                      value={rightMinutes}
                      onChange={(e) => handleTimeInputChange(e.target.value, setRightMinutes, 59)}
                      onKeyDown={(e) => handleKeyDown(e, saveRightDuration)}
                      className="w-20 text-center"
                      min="0"
                      max="59"
                      disabled={loading}
                    />
                    <span className="text-lg">:</span>
                    <Input
                      type="number"
                      value={rightSeconds}
                      onChange={(e) => handleTimeInputChange(e.target.value, setRightSeconds, 59)}
                      onKeyDown={(e) => handleKeyDown(e, saveRightDuration)}
                      className="w-20 text-center"
                      min="0"
                      max="59"
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-medium tracking-wider">
                    {formatTime(displayRightDuration)}
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-3">
                {isEditingRight ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      saveRightDuration();
                    }}
                    disabled={loading}
                  >
                    Save
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isTimerRunning) handleTimerStop();
                      setIsEditingRight(true);
                    }}
                    disabled={loading}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (isTimerRunning && activeBreast === 'RIGHT') {
                      handleTimerStop();
                    } else {
                      handleTimerStop(); // Stop any existing timer
                      setIsEditingRight(false); // Exit edit mode if active
                      handleTimerStart('RIGHT');
                    }
                  }}
                  disabled={loading || isEditingRight}
                >
                  {isTimerRunning && activeBreast === 'RIGHT' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isTimerRunning && activeBreast === 'RIGHT' ? 'Pause' : 'Start'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
