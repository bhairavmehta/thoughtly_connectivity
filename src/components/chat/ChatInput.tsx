
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RecordingTimer } from './RecordingTimer';
import { ChatInputControls } from './ChatInputControls';
import { useToast } from '@/hooks/use-toast';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect?: (file: File) => void;
  onToggleRecording?: () => void;
  isProcessing?: boolean;
  isRecording?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  onFileSelect,
  onToggleRecording,
  isProcessing = false,
  isRecording = false
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Reset textarea height when isRecording changes
  useEffect(() => {
    if (textareaRef.current && isRecording) {
      textareaRef.current.style.height = 'auto';
    }
  }, [isRecording]);

  const handleSendMessage = () => {
    if (message.trim() && !isProcessing && !isRecording) {
      onSendMessage(message.trim());
      setMessage('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRecordingToggle = () => {
    if (onToggleRecording) {
      onToggleRecording();
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 25MB",
          variant: "destructive"
        });
      } else {
        onFileSelect(file);
      }
      // Reset file input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div 
        className={cn(
          "relative flex items-end border border-thoughtly-border bg-thoughtly-card backdrop-blur-md rounded-xl px-4 py-3 transition-all duration-300 shadow-lg",
          focused ? "focused-chat-input" : "",
          isRecording ? "border-red-500 shadow-red-500/20" : ""
        )}
      >
        <RecordingTimer isRecording={isRecording} />
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isRecording ? "Recording audio..." : "Ask anything..."}
          className="w-full resize-none bg-transparent outline-none text-white placeholder:text-gray-400 max-h-32 py-1.5"
          rows={1}
          disabled={isProcessing || isRecording}
          aria-label="Message input"
        />
        
        {onFileSelect && (
          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="audio/*"
              disabled={isProcessing || isRecording}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFileButtonClick}
              disabled={isProcessing || isRecording}
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-thoughtly-muted"
              aria-label="Upload file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </>
        )}
        
        <ChatInputControls
          isRecording={isRecording}
          isProcessing={isProcessing}
          hasMessage={message.trim().length > 0}
          onRecordingToggle={handleRecordingToggle}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
