import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConversation } from '@/hooks/useConversation';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCachedThreads } from '@/hooks/conversation/useCachedThreads';

const Thread = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { 
    messages, 
    isProcessing, 
    isRecording,
    selectedModel,
    setSelectedModel,
    sendMessage, 
    initialize,
    toggleRecording,
    loadConversationHistory,
    resetState
  } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [threadTitle, setThreadTitle] = useState<string>('');
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const previousIdRef = useRef<string | null>(null);
  const { threads, getCachedThreadHistory } = useCachedThreads();
  const historyLoadedRef = useRef(false);
  const initializationCompletedRef = useRef(false);
  
  // When thread ID changes, we need to reset and load new content
  useEffect(() => {
    if (id && previousIdRef.current && id !== previousIdRef.current) {
      console.log('Thread ID changed, resetting state and loading new thread');
      resetState();
      historyLoadedRef.current = false;
      initializationCompletedRef.current = false;
      setThreadTitle('');
    }
    
    previousIdRef.current = id || null;
  }, [id, resetState]);

  useEffect(() => {
    const loadThreadData = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoadingThread(true);
        
        // Find thread in the threads list first to set title immediately
        const existingThread = threads.find(thread => thread.session_id === id);
        if (existingThread) {
          console.log('Found thread in threads list:', existingThread);
          if (existingThread.thread_title) {
            console.log('Setting title from thread data:', existingThread.thread_title);
            setThreadTitle(existingThread.thread_title);
          }
        }
        
        if (initializationCompletedRef.current) {
          console.log('Thread already initialized, skipping');
          setIsLoadingThread(false);
          return;
        }

        // Initialize with the thread ID if not already done
        const success = await initialize(id);
        initializationCompletedRef.current = true;
        
        if (success && !historyLoadedRef.current) {
          // Check if we have cached history for this thread
          const cachedHistory = getCachedThreadHistory(id);
          
          if (cachedHistory) {
            console.log('Using cached history for thread:', id);
            // Update thread title if available in cache and better than what we have
            if (cachedHistory.thread_title && (!threadTitle || threadTitle === 'Untitled Conversation')) {
              console.log('Setting title from cached history:', cachedHistory.thread_title);
              setThreadTitle(cachedHistory.thread_title);
            }
            historyLoadedRef.current = true;
          } else {
            // No cached history, load it once
            console.log('No cached history, loading from API for thread:', id);
            const history = await loadConversationHistory(id);
            
            // Update thread title if available
            if (history && history.thread_title && (!threadTitle || threadTitle === 'Untitled Conversation')) {
              console.log('Setting title from loaded history:', history.thread_title);
              setThreadTitle(history.thread_title);
            }
            
            historyLoadedRef.current = true;
          }
        }
      } catch (error) {
        console.error('Error loading thread data:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation thread",
          variant: "destructive"
        });
      } finally {
        setIsLoadingThread(false);
      }
    };
    
    loadThreadData();
  }, [id, user, initialize, loadConversationHistory, toast, getCachedThreadHistory, threads, threadTitle]);

  // Update thread title if it becomes available in the threads list
  useEffect(() => {
    if (id && (!threadTitle || threadTitle === 'Untitled Conversation') && threads.length > 0) {
      const matchingThread = threads.find(thread => thread.session_id === id);
      if (matchingThread && matchingThread.thread_title) {
        console.log('Updating title from threads update:', matchingThread.thread_title);
        setThreadTitle(matchingThread.thread_title);
      }
    }
  }, [threads, id, threadTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    toast({
      title: "Model changed",
      description: `Now using ${modelId} for responses`,
      duration: 2000,
    });
  };

  const handleSendMessage = (content: string) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Unable to send message - invalid thread ID",
        variant: "destructive"
      });
      return;
    }
    
    sendMessage(content);
  };

  return (
    <div className="min-h-screen flex flex-col pb-12">
      <header className="py-8 px-6 text-center flex items-center justify-between">
        <div className="flex-1">
          {/* Spacer */}
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          {isLoadingThread ? 'Loading...' : (threadTitle || 'Untitled Conversation')}
        </h1>
        <div className="flex-1 flex justify-end">
          {/* Spacer */}
        </div>
      </header>

      <div className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              type={message.type}
              content={message.content}
              timestamp={message.timestamp}
              fileUrl={message.fileUrl}
              fileName={message.fileName}
              fileType={message.fileType}
              id={message.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="py-8 px-4 sticky bottom-0 bg-gradient-to-t from-thoughtly via-thoughtly to-transparent">
        <div className="mb-3 flex justify-center">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
        </div>
        <ChatInput 
          onSendMessage={handleSendMessage}
          onToggleRecording={toggleRecording}
          isProcessing={isProcessing}
          isRecording={isRecording}
        />
      </div>
    </div>
  );
};

export default Thread;
