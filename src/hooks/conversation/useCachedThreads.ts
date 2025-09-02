import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiService } from '@/services/api';
import { ChatHistory } from '@/types/conversation';
import { ThreadHistoryResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

// Global cache to store threads and last fetch time
const threadsCache: {
  data: ChatHistory[] | null;
  lastFetched: number;
} = {
  data: null,
  lastFetched: 0
};

// Cache validity duration in milliseconds (30 seconds)
const CACHE_VALID_DURATION = 30000;

export const useCachedThreads = () => {
  const [threads, setThreads] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const initializeAttempted = useRef(false);
  const isInitializing = useRef(false);
  const initAttemptCountRef = useRef<number>(0);
  const maxInitAttempts = 3;
  const pendingRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const minRefreshInterval = 5000; // Minimum 5 seconds between refreshes

  // Debounced refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback((forceRefresh = false) => {
    // Cancel any pending refresh
    if (pendingRefreshRef.current) {
      clearTimeout(pendingRefreshRef.current);
    }
    
    const now = Date.now();
    // If not forced and it's been less than minRefreshInterval since last refresh, debounce it
    if (!forceRefresh && (now - lastRefreshTimeRef.current < minRefreshInterval)) {
      pendingRefreshRef.current = setTimeout(() => {
        fetchThreads(forceRefresh);
        pendingRefreshRef.current = null;
      }, 300);
    } else {
      // Otherwise refresh immediately
      fetchThreads(forceRefresh);
      lastRefreshTimeRef.current = now;
    }
  }, []);

  const fetchThreads = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setIsLoading(false);
      setThreads([]);
      return;
    }

    // Prevent concurrent initialization attempts
    if (isInitializing.current) {
      console.log('Thread fetch already in progress, skipping duplicate call');
      return;
    }

    // Check cache first
    const now = Date.now();
    const isCacheValid = 
      !forceRefresh && 
      threadsCache.data && 
      (now - threadsCache.lastFetched) < CACHE_VALID_DURATION;

    if (isCacheValid) {
      console.log('Using cached threads data');
      setThreads(threadsCache.data);
      setIsLoading(false);
      return;
    }

    // Limit retries
    if (initAttemptCountRef.current >= maxInitAttempts) {
      console.log(`Max initialization attempts (${maxInitAttempts}) reached`);
      setError('Failed to connect to server after multiple attempts');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      isInitializing.current = true;
      initAttemptCountRef.current++;
      
      // Always use the dedicated getThreads endpoint which is more reliable
      console.log('Fetching threads directly using getThreads');
      const threadsData = await ApiService.getThreads(user.id);
      
      if (threadsData && threadsData.length > 0) {
        // Filter out entries with empty session_id
        const validThreads = threadsData.filter(thread => thread.session_id);
        
        console.log('Successfully loaded chat history, threads count:', validThreads.length);
        
        // Sort threads by timestamp (newest first)
        const sortedThreads = [...validThreads].sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        });
        
        setThreads(sortedThreads);
        threadsCache.data = sortedThreads;
        threadsCache.lastFetched = now;
        setError(null);
        
        // Show success toast on forced refresh
        if (forceRefresh) {
          toast({
            title: "Threads refreshed",
            description: `Loaded ${sortedThreads.length} conversation threads`,
          });
        }
      } else {
        console.log('No chat history found or invalid format, setting empty threads array');
        setThreads([]);
        threadsCache.data = [];
        threadsCache.lastFetched = now;
      }
      
      initializeAttempted.current = true;
    } catch (error) {
      console.error('Error fetching threads:', error);
      setError('Failed to load recent threads');
      
      if (forceRefresh) {
        toast({
          title: "Error refreshing threads",
          description: "Could not retrieve your conversation history",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      isInitializing.current = false;
    }
  }, [user, toast]);

  // Initial fetch - only once when component mounts
  useEffect(() => {
    if (user && !initializeAttempted.current) {
      console.log('useCachedThreads: Initial fetch of threads');
      fetchThreads();
    }
  }, [user, fetchThreads]);

  // Helper to get thread history from cache
  const getCachedThreadHistory = useCallback((threadId: string): ThreadHistoryResponse | undefined => {
    if (!user) return undefined;
    return ApiService.getCachedThreadHistory(user.id, threadId);
  }, [user]);

  // Helper to store thread history in cache
  const cacheThreadHistory = useCallback((threadId: string, history: ThreadHistoryResponse): void => {
    if (!user) return;
    ApiService.cacheThreadHistory(user.id, threadId, history);
  }, [user]);

  return {
    threads,
    isLoading,
    error,
    refreshThreads: () => debouncedRefresh(true),
    getCachedThreadHistory,
    cacheThreadHistory
  };
};
