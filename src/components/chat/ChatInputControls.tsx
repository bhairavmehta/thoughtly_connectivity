
import { Loader2, Mic, MicOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  hasMessage: boolean;
  onRecordingToggle: () => void;
  onSendMessage: () => void;
}

export function ChatInputControls({
  isRecording,
  isProcessing,
  hasMessage,
  onRecordingToggle,
  onSendMessage,
}: ChatInputControlsProps) {
  const isProcessingTranscription = isProcessing && isRecording;
  
  return (
    <div className="flex items-center gap-1 ml-2 mt-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full transition-colors",
          isRecording 
            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" 
            : "text-gray-400 hover:text-white hover:bg-thoughtly-muted"
        )}
        onClick={onRecordingToggle}
        disabled={isProcessing && !isRecording}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        type="button"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
          hasMessage && !isProcessing && !isRecording
            ? "bg-thoughtly-accent hover:bg-thoughtly-accent-hover text-white"
            : "bg-thoughtly-muted/60 text-gray-400 cursor-not-allowed"
        )}
        disabled={!hasMessage || isProcessing || isRecording}
        onClick={onSendMessage}
        aria-label="Send message"
      >
        {isProcessing && !isProcessingTranscription ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
