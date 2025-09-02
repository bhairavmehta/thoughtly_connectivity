
import React from 'react';
import { cn } from '@/lib/utils';
import { CircleUser, Bot, FileText, FileIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface ChatMessageProps {
  type: 'user' | 'assistant' | 'system' | 'thinking' | 'file';
  content: string;
  timestamp?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  id?: string; // Added id prop to match Message interface
}

export function ChatMessage({ 
  type, 
  content, 
  timestamp, 
  fileUrl,
  fileName,
  fileType,
  id
}: ChatMessageProps) {
  const isUser = type === 'user';
  const isThinking = type === 'thinking';
  const isFile = type === 'file';
  const isSystem = type === 'system';

  const getFileIcon = () => {
    if (!fileType) return <FileIcon className="h-5 w-5" />;

    if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5" />;
    }
    
    // Add more file type icons as needed
    return <FileIcon className="h-5 w-5" />;
  };

  return (
    <div
      className={cn(
        'flex w-full max-w-3xl mx-auto items-start gap-3 py-4 px-4 transition-colors',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
            : isThinking
            ? 'animate-pulse bg-gradient-to-br from-gray-500 to-gray-700 text-white'
            : isSystem
            ? 'bg-gradient-to-br from-green-500 to-green-700 text-white'
            : 'bg-gradient-to-br from-thoughtly-accent to-thoughtly-accent-dark text-white'
        )}
      >
        {isUser ? (
          <CircleUser className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'flex min-h-[32px] flex-1 flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2.5 shadow-sm',
            isUser
              ? 'bg-thoughtly-accent-trans text-white'
              : isThinking
              ? 'bg-thoughtly-muted/70 text-thoughtly-subtle animate-pulse'
              : isSystem
              ? 'bg-green-700/90 text-white'
              : 'bg-thoughtly-card text-white'
          )}
        >
          {isThinking ? (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 rounded-full bg-current animate-bounce"></div>
              </div>
              <span>{content}</span>
            </div>
          ) : isFile ? (
            <div className="flex items-center gap-2">
              {getFileIcon()}
              {fileUrl ? (
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-thoughtly-accent underline underline-offset-2 hover:text-thoughtly-accent-hover"
                >
                  {content}
                </a>
              ) : (
                <span>{content}</span>
              )}
            </div>
          ) : (
            <ReactMarkdown className="prose prose-invert max-w-none">
              {content}
            </ReactMarkdown>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className="px-2 text-xs text-thoughtly-subtle">{timestamp}</div>
        )}
      </div>
    </div>
  );
}
