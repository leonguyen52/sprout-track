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
  
  // Local state for editing
  const [leftHours, setLeftHours] = useState(0);
  const [leftMinutes, setLeftMinutes] = useState(0);
  const [leftSeconds, setLeftSeconds] = useState(0);
  
  const [rightHours, setRightHours] = useState(0);
  const [rightMinutes, setRightMinutes] = useState(0);
  const [rightSeconds, setRightSeconds] = useState(0);
  
  // Update local state when durations change
  useEffect(() => {
    if (!isEditingLeft) {
      const { hours, minutes, seconds } = extractTimeComponents(leftDuration);
      setLeftHours(hours);
      setLeftMinutes(minutes);
      setLeftSeconds(seconds);
    }
  }, [leftDuration, isEditingLeft]);
  
  useEffect(() => {
    if (!isEditingRight) {
      const { hours, minutes, seconds } = extractTimeComponents(rightDuration);
      setRightHours(hours);
      setRightMinutes(minutes);
      setRightSeconds(seconds);
    }
  }, [rightDuration, isEditingRight]);
  
  // Handle saving edited duration
  const saveLeftDuration = () => {
    const totalSeconds = (leftHours * 3600) + (leftMinutes * 60) + leftSeconds;
    onDurationChange('LEFT', totalSeconds);
    setIsEditingLeft(false);
  };
  
  const saveRightDuration = () => {
    const totalSeconds = (rightHours * 3600) + (rightMinutes * 60) + rightSeconds;
    onDurationChange('RIGHT', totalSeconds);
    setIsEditingRight(false);
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
              // Toggle the side selection only if not editing an existing record
              if (!isEditing) {
                const newSide = side === 'LEFT' ? '' : 'LEFT';
                onSideChange(newSide as BreastSide | '');
              }
            }}
            disabled={loading || (isEditing && side !== 'LEFT')} // Disable if editing and not LEFT
            variant={side === 'LEFT' ? 'default' : 'outline'}
            className="w-full"
          >
            Left
          </Button>
          
          <Button
            type="button"
            onClick={() => {
              // Toggle the side selection only if not editing an existing record
              if (!isEditing) {
                const newSide = side === 'RIGHT' ? '' : 'RIGHT';
                onSideChange(newSide as BreastSide | '');
              }
            }}
            disabled={loading || (isEditing && side !== 'RIGHT')} // Disable if editing and not RIGHT
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
                    {formatTime(leftDuration)}
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
                      if (isTimerRunning) onTimerStop();
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
                      onTimerStop();
                    } else {
                      onTimerStop(); // Stop any existing timer
                      setIsEditingLeft(false); // Exit edit mode if active
                      onTimerStart('LEFT');
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
                    {formatTime(rightDuration)}
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
                      if (isTimerRunning) onTimerStop();
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
                      onTimerStop();
                    } else {
                      onTimerStop(); // Stop any existing timer
                      setIsEditingRight(false); // Exit edit mode if active
                      onTimerStart('RIGHT');
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
