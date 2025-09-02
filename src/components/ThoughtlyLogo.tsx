
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';

interface ThoughtlyLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function ThoughtlyLogo({ className, iconOnly = false }: ThoughtlyLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="text-thoughtly-accent">
        <Brain className="h-6 w-6" />
      </div>
      {!iconOnly && (
        <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Thoughtly
        </span>
      )}
    </div>
  );
}
