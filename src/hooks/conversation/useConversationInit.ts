
import { useCallback, useRef, useState } from 'react';
import { ApiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ChatHistory } from '@/types/conversation';
import { ThreadHistoryResponse } from '@/types/api';

interface InitializeResponseWithError {
  error?: string;
  chat_history?: ChatHistory[];
}

export const useConversationInit = (
  user: any,
  setIsProcessing: (value: boolean) => void,
  setInitializationAttempted: (value: boolean) => void,
  setInitializationFailed: (value: boolean) => void,
  setIsInitialized: (value: boolean) => void,
  setChatHistory: (history: ChatHistory[]) => void,
  setSessionId: (id: string) => void,
  loadConversationHistory: (sid: string) => Promise<ThreadHistoryResponse | null>
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

    // Skip if already initialized and just setting session ID
    if (initialized && existingSessionId && existingSessionId === existingSessionId) {
      console.log('Already initialized with this session ID, skipping');
      return true;
    }

    // Prevent concurrent initialization
    if (initializationInProgressRef.current) {
      console.log('Initialization already in progress, skipping duplicate call');
      return false;
    }

    // Limit initialization attempts
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
      
      // Get user's thread history from the initialization endpoint
      const response = await ApiService.initialize(user.id);
      
      // Cast response to check for errors
      const responseWithError = response as InitializeResponseWithError;
      
      if (!response || responseWithError.error) {
        throw new Error(responseWithError.error || 'Failed to initialize conversation');
      }

      // Set chat history from initialization response
      if (response.chat_history) {
        console.log('Setting chat history from initialization response:', response.chat_history);
        setChatHistory(response.chat_history);
      }
      
      // If we're initializing with an existing session ID, set it
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
