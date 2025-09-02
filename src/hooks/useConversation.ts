
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/types/conversation';
import { useMessageHandling } from './conversation/useMessageHandling';
import { useAudioRecording } from './conversation/useAudioRecording';
import { useThreadInitialization } from './conversation/useThreadInitialization';
import { useThreadManagement } from './conversation/useThreadManagement';
import { useConversationState } from './conversation/useConversationState';
import { ApiService } from '@/services/api';
import { ThreadHistoryResponse } from '@/types/api';

export const useConversation = () => {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>("claude-3.5-sonnet");
  
  const {
    messages,
    setMessages,
    isProcessing,
    setIsProcessing,
    isInitialized,
    setIsInitialized,
    isRecording,
    setIsRecording,
    sessionId,
    setSessionId,
    chatHistory,
    setChatHistory,
    initializationFailed,
    setInitializationFailed,
    initializationAttempted,
    setInitializationAttempted
  } = useConversationState();

  const { initialize } = useThreadInitialization(
    user,
    setIsProcessing,
    setChatHistory,
    setSessionId,
    setIsInitialized,
    setInitializationFailed,
    setInitializationAttempted
  );

  const { createNewThread, resetState, getFormattedTime } = useThreadManagement(
    user,
    setMessages,
    setSessionId,
    setIsInitialized,
    initialize
  );

  const { sendMessage } = useMessageHandling(
    user,
    sessionId,
    setMessages,
    setIsProcessing,
    getFormattedTime,
    selectedModel
  );

  // Track history loading to prevent duplicate calls
  const historyLoadingRef = { current: new Map<string, boolean>() };
  
  // Audio transcription state management
  const transcriptionInProgressRef = useRef<boolean>(false);

  const processAudioTranscription = useCallback(async (audioBlob: Blob) => {
    if (!user || !sessionId) {
      console.log('Cannot process audio: missing user or sessionId');
      return;
    }
    
    // Prevent simultaneous transcriptions
    if (transcriptionInProgressRef.current) {
      console.log('Transcription already in progress, skipping');
      return;
    }
    
    transcriptionInProgressRef.current = true;
    
    try {
      setIsProcessing(true);
      
      // Create a unique, temporary processing message ID
      const processingMessageId = `processing-${Date.now()}`;
      
      // Add a temporary processing message
      const recordingMessage: Message = {
        id: processingMessageId,
        type: 'user',
        content: 'Processing audio recording...',
        timestamp: getFormattedTime()
      };
      
      console.log('Adding temporary processing message with ID:', processingMessageId);
      setMessages(prev => [...prev, recordingMessage]);
      
      // Prepare the form data for the API call
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('user_id', user.id);
      formData.append('session_id', sessionId);
      
      console.log(`Sending audio for transcription (size: ${audioBlob.size} bytes)`);
      const transcriptionResponse = await ApiService.transcribeAudio(formData);
      
      if (transcriptionResponse && transcriptionResponse.transcription) {
        const transcribedText = transcriptionResponse.transcription;
        console.log('Transcription received:', transcribedText);
        
        // Replace the processing message with the transcription
        setMessages(prev => prev.map(msg => 
          msg.id === processingMessageId
            ? { ...msg, content: transcribedText }
            : msg
        ));
        
        // Send the transcribed text to get a response
        // Pass false to prevent adding another user message
        await sendMessage(transcribedText, false);
      } else {
        console.error('Transcription failed or returned empty');
        
        // Update the processing message to show the error
        setMessages(prev => prev.map(msg => 
          msg.id === processingMessageId
            ? { ...msg, content: "Could not transcribe audio. Please try again." }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Add an error message
      setMessages(prev => [
        ...prev.filter(msg => !msg.id?.startsWith('processing-')), 
        {
          id: `error-${Date.now()}`,
          type: 'system',
          content: 'Error processing audio. Please try again.',
          timestamp: getFormattedTime()
        }
      ]);
    } finally {
      setIsProcessing(false);
      transcriptionInProgressRef.current = false;
    }
  }, [user, sessionId, sendMessage, setMessages, setIsProcessing, getFormattedTime]);

  const {
    toggleRecording,
    isRecordingActive
  } = useAudioRecording(processAudioTranscription, isRecording, setIsRecording);

  // Monitor recording state to ensure UI and actual recorder state are in sync
  useEffect(() => {
    const checkRecordingState = () => {
      const actuallyRecording = isRecordingActive();
      if (isRecording !== actuallyRecording) {
        console.log(`Recording state mismatch. UI: ${isRecording}, Actual: ${actuallyRecording}`);
        setIsRecording(actuallyRecording);
      }
    };
    
    const interval = setInterval(checkRecordingState, 1000);
    return () => clearInterval(interval);
  }, [isRecording, isRecordingActive, setIsRecording]);

  const loadConversationHistory = useCallback(async (threadId: string): Promise<ThreadHistoryResponse | null> => {
    if (!user || !threadId) return null;
    
    // Prevent duplicate loading of the same history
    if (historyLoadingRef.current.get(threadId)) {
      console.log('Already loading history for thread:', threadId);
      return null;
    }
    
    historyLoadingRef.current.set(threadId, true);
    
    try {
      setIsProcessing(true);
      
      // Check if we already have this cached first
      const cachedHistory = ApiService.getCachedThreadHistory(user.id, threadId);
      if (cachedHistory) {
        console.log('Using cached thread history for:', threadId);
        
        const formattedMessages: Message[] = cachedHistory.history.map(msg => ({
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : getFormattedTime()
        }));
        
        setMessages(formattedMessages);
        return cachedHistory;
      }
      
      // If not cached, make API call
      console.log('Thread history not cached, fetching from API:', threadId);
      const response = await ApiService.getThreadHistory(user.id, threadId);
      
      if (response && response.history && Array.isArray(response.history)) {
        const formattedMessages: Message[] = response.history.map(msg => ({
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : getFormattedTime()
        }));
        
        setMessages(formattedMessages);
        
        // Cache the result for future use
        ApiService.cacheThreadHistory(user.id, threadId, response);
        
        return response;
      }
      
      console.warn('No history found or invalid format for thread:', threadId);
      return null;
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return null;
    } finally {
      setIsProcessing(false);
      historyLoadingRef.current.delete(threadId);
    }
  }, [user, setMessages, setIsProcessing, getFormattedTime]);

  return {
    messages,
    isProcessing,
    isRecording,
    sessionId,
    chatHistory,
    initializationFailed,
    selectedModel,
    setSelectedModel,
    sendMessage,
    initialize,
    resetState,
    createNewThread,
    toggleRecording,
    loadConversationHistory,
  };
};
