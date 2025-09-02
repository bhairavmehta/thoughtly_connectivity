
import { useEffect, useState, useRef } from 'react';

interface RecordingTimerProps {
  isRecording: boolean;
}

export function RecordingTimer({ isRecording }: RecordingTimerProps) {
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  // Reset timer and start/stop based on isRecording prop
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRecording) {
      console.log('Starting recording timer');
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      console.log('Resetting recording timer');
      setRecordingDuration(0);
    }
    
    // Clean up on unmount or when isRecording changes
    return () => {
      if (timerRef.current) {
        console.log('Cleaning up recording timer');
        window.clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!isRecording) return null;

  return (
    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-sm py-1 px-3 rounded-full flex items-center gap-2 animate-pulse shadow-lg">
      <span className="h-2 w-2 bg-white rounded-full animate-ping"></span>
      Recording {formatTime(recordingDuration)}
    </div>
  );
}
