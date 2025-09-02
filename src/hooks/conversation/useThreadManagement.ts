
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/api';
import { Message } from '@/types/conversation';
import { useCachedThreads } from './useCachedThreads';

export const useThreadManagement = (
  user: any,
  setMessages: (messages: Message[]) => void,
  setSessionId: (id: string) => void,
  setIsInitialized: (value: boolean) => void,
  initialize: (sessionId?: string) => Promise<boolean>
) => {
  const { toast } = useToast();
  const { refreshThreads } = useCachedThreads();

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const createNewThread = useCallback(async () => {
    try {
      setMessages([]);
      
      if (!user) throw new Error('Not authenticated');
      
      // Initialize API connection first
      await initialize();
      
      const sessionResponse = await ApiService.createSession(user.id);
      const newSessionId = sessionResponse.session_id;
      
      setSessionId(newSessionId);
      setIsInitialized(true);
      
      const welcomeMessage: Message = {
        type: 'assistant',
        content: "I've started a new conversation thread for you. How can I help today?",
        timestamp: getFormattedTime()
      };
      
      setMessages([welcomeMessage]);
      
      console.log('New thread created with session ID:', newSessionId);
      
      // Use a slight delay to give backend time to register the new thread
      setTimeout(() => {
        console.log('Refreshing threads after new thread creation');
        refreshThreads();
      }, 1000);
      
      return newSessionId;
    } catch (error) {
      console.error('Error creating new thread:', error);
      toast({
        title: "Error",
        description: "Failed to create new thread",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, initialize, setMessages, setSessionId, setIsInitialized, refreshThreads]);

  const resetState = useCallback(() => {
    setMessages([]);
    setSessionId('');
  }, [setMessages, setSessionId]);

  return {
    createNewThread,
    resetState,
    getFormattedTime
  };
};
