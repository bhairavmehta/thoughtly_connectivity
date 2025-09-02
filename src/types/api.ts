
import { ChatHistory } from './conversation';

export interface InitializeResponse {
  message: string;
  user_id: string;
  chat_history: ChatHistory[];
  error?: string;
}

export interface SessionResponse {
  session_id: string;
  user_id: string;
  message: string;
  error?: string;
}

export interface MessageResponse {
  response: string;
  user_id: string;
  session_id: string;
  error?: string;
}

export interface TitleResponse {
  title: string;
  user_id: string;
  session_id: string;
  error?: string;
}

export interface TranscriptionResponse {
  transcription: string;
  user_id: string;
  session_id: string;
  error?: string;
}

export interface HistoryTurn {
  role: string;
  content: string;
  timestamp: string;
}

export interface ThreadHistoryResponse {
  history: HistoryTurn[];
  user_id: string;
  session_id: string;
  thread_title?: string;
  error?: string;
}
