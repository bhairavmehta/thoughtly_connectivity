
import { useState } from 'react';
import { Message, ChatHistory } from '@/types/conversation';

export const useConversationState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [threadTitle, setThreadTitle] = useState<string>('');
  const [initializationFailed, setInitializationFailed] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  return {
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
    threadTitle,
    setThreadTitle,
    initializationFailed,
    setInitializationFailed,
    initializationAttempted,
    setInitializationAttempted,
  };
};
