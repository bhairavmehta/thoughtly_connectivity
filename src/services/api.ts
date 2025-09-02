
import { handleApiResponse } from '@/utils/api';
import { InitializeResponse, SessionResponse, MessageResponse, TitleResponse, TranscriptionResponse, ThreadHistoryResponse } from '@/types/api';
import { ChatHistory } from '@/types/conversation';

const API_BASE_URL = 'https://api.knoetik.ai';

// Request deduplication with timeouts
const pendingRequests = new Map();
const requestTimeouts = new Map();

// Session cache for initialization data
const sessionCache = new Map<string, {
  chatHistory: ChatHistory[];
  lastFetched: number;
}>();

// Thread history cache
const historyCache = new Map<string, {
  data: ThreadHistoryResponse;
  timestamp: number;
}>();

// Cache validity duration (30 seconds)
const CACHE_VALID_DURATION = 30000;

// Helper for deduplicating requests with timeout protection
const dedupRequest = async (key: string, requestFn: () => Promise<any>, timeoutMs: number = 10000) => {
  // If there's already a pending request with this key, return that promise
  if (pendingRequests.has(key)) {
    console.log(`Request for ${key} already in progress, reusing promise`);
    return pendingRequests.get(key);
  }
  
  // Clear any existing timeout for this key
  if (requestTimeouts.has(key)) {
    clearTimeout(requestTimeouts.get(key));
    requestTimeouts.delete(key);
  }
  
  // Create the new request promise
  const promise = requestFn();
  pendingRequests.set(key, promise);
  
  // Set a timeout to remove the pending request if it takes too long
  const timeoutId = setTimeout(() => {
    console.log(`Request for ${key} timed out, removing from pending`);
    pendingRequests.delete(key);
    requestTimeouts.delete(key);
  }, timeoutMs);
  
  requestTimeouts.set(key, timeoutId);
  
  try {
    const result = await promise;
    return result;
  } catch (error) {
    // We should rethrow the error to handle it in the calling function
    throw error;
  } finally {
    pendingRequests.delete(key);
    if (requestTimeouts.has(key)) {
      clearTimeout(requestTimeouts.get(key));
      requestTimeouts.delete(key);
    }
  }
};

export class ApiService {
  static async initialize(userId: string): Promise<InitializeResponse> {
    const requestKey = `initialize_${userId}`;
    
    // Check cache first
    const cachedData = sessionCache.get(userId);
    const isCacheValid = cachedData && 
      (Date.now() - cachedData.lastFetched < CACHE_VALID_DURATION);
    
    if (isCacheValid) {
      console.log('Using cached initialization data for user:', userId);
      return {
        message: 'Using cached data',
        user_id: userId,
        chat_history: cachedData.chatHistory
      };
    }

    return dedupRequest(requestKey, async () => {
      console.log('Making new initialization request for user:', userId);
      try {
        const response = await fetch(`${API_BASE_URL}/initialize/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        
        const data = await handleApiResponse(response);
        
        // Store in cache
        if (data.chat_history) {
          sessionCache.set(userId, {
            chatHistory: data.chat_history,
            lastFetched: Date.now()
          });
        }
        
        return data;
      } catch (error) {
        console.error('Error initializing:', error);
        throw error;
      }
    }, 15000); // 15 second timeout for initialization
  }

  static async createSession(userId: string): Promise<SessionResponse> {
    const requestKey = `create_session_${userId}`;
    return dedupRequest(requestKey, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/initialize_session/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        return handleApiResponse(response);
      } catch (error) {
        console.error('Error creating session:', error);
        throw error;
      }
    });
  }

  static async sendMessage(userId: string, sessionId: string, query: string): Promise<MessageResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/invoke/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          user_id: userId,
          session_id: sessionId,
          user_memory: true,
          session_memory: true
        })
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async generateTitle(userId: string, sessionId: string, query: string): Promise<TitleResponse> {
    try {
      console.log('Generating title for', sessionId, 'with query', query);
      const response = await fetch(`${API_BASE_URL}/generate_title/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          query
        })
      });
      const result = await handleApiResponse(response);
      console.log('Title generation response:', result);
      return result;
    } catch (error) {
      console.error('Error generating title:', error);
      throw error;
    }
  }

  static async getHistory(userId: string, sessionId: string): Promise<ThreadHistoryResponse> {
    // This function is kept for backward compatibility
    // We should use the cached thread history or initialize data instead
    console.warn('getHistory called - consider using getCachedThreadHistory instead');
    
    return this.getThreadHistory(userId, sessionId);
  }

  static async transcribeAudio(formData: FormData): Promise<TranscriptionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/transcribe/`, {
        method: 'POST',
        body: formData
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }
  
  // Helper to get thread details from cached initialization data
  static getThreadFromCache(userId: string, threadId: string): ChatHistory | undefined {
    const userCache = sessionCache.get(userId);
    if (userCache && userCache.chatHistory) {
      return userCache.chatHistory.find(thread => thread.session_id === threadId);
    }
    return undefined;
  }
  
  // Helper to get thread message history - prioritizing the cache
  static async getThreadHistory(userId: string, threadId: string): Promise<ThreadHistoryResponse> {
    const historyKey = `${userId}_${threadId}`;
    const cachedHistory = historyCache.get(historyKey);
    const now = Date.now();
    
    if (cachedHistory && (now - cachedHistory.timestamp < CACHE_VALID_DURATION)) {
      console.log('Using cached thread history:', threadId);
      return cachedHistory.data;
    }
    
    // Deduplicate concurrent calls to get the same thread history
    const requestKey = `history_${userId}_${threadId}`;
    
    return dedupRequest(requestKey, async () => {
      try {
        // Fetch from API
        console.log('Fetching thread history from API:', threadId);
        const response = await fetch(`${API_BASE_URL}/history/${userId}/${threadId}`);
        const history = await handleApiResponse(response);
        
        // Cache the result
        historyCache.set(historyKey, {
          data: history,
          timestamp: now
        });
        
        return history;
      } catch (error) {
        console.error('Error fetching thread history:', error);
        throw error;
      }
    });
  }
  
  static cacheThreadHistory(userId: string, threadId: string, history: ThreadHistoryResponse): void {
    const historyKey = `${userId}_${threadId}`;
    historyCache.set(historyKey, {
      data: history,
      timestamp: Date.now()
    });
  }
  
  static getCachedThreadHistory(userId: string, threadId: string): ThreadHistoryResponse | undefined {
    const historyKey = `${userId}_${threadId}`;
    const cachedHistory = historyCache.get(historyKey);
    
    if (cachedHistory && (Date.now() - cachedHistory.timestamp < CACHE_VALID_DURATION)) {
      return cachedHistory.data;
    }
    
    return undefined;
  }

  // New endpoint to get all threads for a user
  static async getThreads(userId: string): Promise<ChatHistory[]> {
    const requestKey = `threads_${userId}`;
    return dedupRequest(requestKey, async () => {
      try {
        console.log('Fetching all threads for user:', userId);
        const response = await fetch(`${API_BASE_URL}/threads/${userId}`);
        const data = await handleApiResponse(response);
        
        // Log to inspect data format
        console.log('Threads API response:', data);
        
        // Update the session cache with the latest threads
        if (Array.isArray(data)) {
          // Filter out entries with empty session_id
          const validThreads = data.filter(thread => thread.session_id);
          
          sessionCache.set(userId, {
            chatHistory: validThreads,
            lastFetched: Date.now()
          });
          return validThreads;
        }
        return [];
      } catch (error) {
        console.error('Error fetching threads:', error);
        throw error;
      }
    });
  }
}
