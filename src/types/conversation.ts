
export interface Message {
  id?: string; // Added for message identification
  type: 'user' | 'assistant' | 'system' | 'thinking' | 'file';
  content: string;
  timestamp?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  timestamp?: string;
}

// Re-adding ChatHistory interface that was removed
export interface ChatHistory {
  session_id: string;
  thread_title: string;
  last_message: string;
  timestamp: string;
}

export interface ThreadTitle {
  title: string;
  user_id: string;
  session_id: string;
}
