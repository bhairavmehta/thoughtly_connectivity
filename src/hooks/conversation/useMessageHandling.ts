
import { useCallback, useRef } from 'react';
import { ApiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/conversation';
import { useCachedThreads } from './useCachedThreads';

export const useMessageHandling = (
  user: any,
  sessionId: string,
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  setIsProcessing: (value: boolean) => void,
  getFormattedTime: () => string,
  modelId: string = 'claude-3.5-sonnet' // Default model
) => {
  const { toast } = useToast();
  const { refreshThreads } = useCachedThreads();
  const messageInProgressRef = useRef<boolean>(false);
  const titleGeneratedRef = useRef<boolean>(false);

  const sendMessage = useCallback(async (content: string, addUserMessage: boolean = true) => {
    if (!content.trim() || !user || !sessionId) {
      console.log('Cannot send message: missing content, user, or sessionId', { 
        contentEmpty: !content.trim(), 
        userMissing: !user, 
        sessionIdMissing: !sessionId 
      });
      return;
    }
    
    // Prevent duplicate message sending
    if (messageInProgressRef.current) {
      console.log('Message sending already in progress, skipping duplicate call');
      return;
    }
    
    if (addUserMessage) {
      const userMessage: Message = {
        id: Date.now().toString(), // Add unique ID
        type: 'user',
        content,
        timestamp: getFormattedTime()
      };
      
      setMessages((prev: Message[]) => [...prev, userMessage]);
    }
    
    setIsProcessing(true);
    messageInProgressRef.current = true;
    
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`, // Add unique ID
      type: 'thinking',
      content: 'Thinking...'
    };
    
    setMessages((prev: Message[]) => [...prev, thinkingMessage]);
    
    try {
      console.log(`Sending message to session ${sessionId} with model ${modelId}:`, content);
      const response = await ApiService.sendMessage(user.id, sessionId, content);
      
      setMessages((prev: Message[]) => prev.filter(msg => msg.type !== 'thinking'));
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`, // Add unique ID
        type: 'assistant',
        content: response.response || 'I processed your request but didn\'t get a valid response.',
        timestamp: getFormattedTime()
      };
      
      setMessages((prev: Message[]) => [...prev, assistantMessage]);
      
      // Generate title if this is the first message and we haven't generated a title yet
      if (!titleGeneratedRef.current) {
        try {
          console.log('Generating title for thread', sessionId);
          const titleResponse = await ApiService.generateTitle(user.id, sessionId, content);
          
          if (titleResponse && titleResponse.title) {
            console.log('Generated thread title:', titleResponse.title);
            titleGeneratedRef.current = true;
            
            // Refresh threads to update the title in the sidebar
            await refreshThreads();
          }
        } catch (titleError) {
          console.error('Error generating title:', titleError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev: Message[]) => prev.filter(msg => msg.type !== 'thinking'));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`, // Add unique ID
        type: 'assistant',
        content: "I'm having trouble connecting to the server. Please try again later.",
        timestamp: getFormattedTime()
      };
      
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      messageInProgressRef.current = false;
    }
  }, [user, toast, sessionId, setMessages, setIsProcessing, getFormattedTime, refreshThreads, modelId]);

  return {
    sendMessage,
    getFormattedTime
  };
};
