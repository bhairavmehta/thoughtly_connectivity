
import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/api';
import { ChatHistory } from '@/types/conversation';

export const useThreadInitialization = (
  user: any,
  setIsProcessing: (value: boolean) => void,
  setChatHistory: (history: ChatHistory[]) => void,
  setSessionId: (id: string) => void,
  setIsInitialized: (value: boolean) => void,
  setInitializationFailed: (value: boolean) => void,
  setInitializationAttempted: (value: boolean) => void
) => {
  const { toast } = useToast();
  const initializationInProgressRef = useRef<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const initAttemptCountRef = useRef<number>(0);
  const maxAttempts = 3;

  const initialize = useCallback(async (existingSessionId?: string) => {
    if (!user) {
      setInitializationFailed(true);
      return false;
    }

    if (initialized && existingSessionId && existingSessionId === existingSessionId) {
      console.log('Already initialized with this session ID, skipping');
      return true;
    }

    if (initializationInProgressRef.current) {
      console.log('Initialization already in progress, skipping duplicate call');
      return false;
    }

    if (initAttemptCountRef.current >= maxAttempts) {
      console.log('Max initialization attempts reached');
      setInitializationFailed(true);
      return false;
    }

    try {
      initializationInProgressRef.current = true;
      setIsProcessing(true);
      setInitializationAttempted(true);
      initAttemptCountRef.current++;
      
      const response = await ApiService.initialize(user.id);
      
      if (!response || response.error) {
        throw new Error(response?.error || 'Failed to initialize conversation');
      }

      if (response.chat_history) {
        console.log('Setting chat history from initialization:', response.chat_history);
        setChatHistory(response.chat_history);
      }
      
      if (existingSessionId) {
        setSessionId(existingSessionId);
      }
      
      setIsInitialized(true);
      setInitializationFailed(false);
      setInitialized(true);
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      setInitializationFailed(true);
      toast({
        title: "Failed to initialize conversation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
      initializationInProgressRef.current = false;
    }
  }, [user, toast, setIsProcessing, setInitializationAttempted, setInitializationFailed, setIsInitialized, setChatHistory, setSessionId, initialized]);

  return { initialize };
};
