
import { useRef, useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioRecording = (
  processAudioTranscription: (blob: Blob) => Promise<void>,
  isRecording: boolean,
  setIsRecording: (value: boolean) => void
) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const processingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRecordingRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Cleanup function for media resources
  const cleanupResources = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    activeRecordingRef.current = false;
  }, []);

  // Reset processing state when recording stops
  useEffect(() => {
    if (!isRecording) {
      processingRef.current = false;
    }
  }, [isRecording]);

  // Ensure resources are cleaned up when component unmounts
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  const toggleRecording = useCallback(async () => {
    // If already recording, stop recording
    if (isRecording) {
      console.log('Stopping recording');
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        // State will be updated in the onstop handler
      } else {
        console.log('MediaRecorder not available or not recording');
        setIsRecording(false);
        activeRecordingRef.current = false;
      }
      return;
    }
    
    // Start recording
    try {
      cleanupResources(); // Clean up any previous recording session
      
      console.log('Requesting microphone access');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      processingRef.current = false;
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Set active recording state before starting to prevent race conditions
      activeRecordingRef.current = true;
      setIsRecording(true);
      
      mediaRecorder.onstart = () => {
        console.log('Recording started');
      };
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio');
        setIsRecording(false);
        activeRecordingRef.current = false;
        
        if (audioChunksRef.current.length === 0) {
          console.log('No audio data recorded');
          cleanupResources();
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
        });
        
        if (audioBlob.size > 0 && !processingRef.current) {
          processingRef.current = true;
          console.log(`Processing audio, size: ${audioBlob.size} bytes`);
          await processAudioTranscription(audioBlob);
        } else {
          console.log('Skipping audio processing - empty blob or already processing');
        }
        
        cleanupResources();
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Recording Error",
          description: "An error occurred during recording",
          variant: "destructive"
        });
        cleanupResources();
        setIsRecording(false);
        activeRecordingRef.current = false;
      };
      
      // Start recording with smaller timeslices to get data more frequently
      mediaRecorder.start(500);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
      setIsRecording(false);
      activeRecordingRef.current = false;
    }
  }, [isRecording, setIsRecording, processAudioTranscription, cleanupResources, toast]);

  // Additional function to check if recording is active
  const isRecordingActive = useCallback(() => {
    return activeRecordingRef.current;
  }, []);

  return {
    toggleRecording,
    isRecordingActive,
    mediaRecorderRef
  };
};
