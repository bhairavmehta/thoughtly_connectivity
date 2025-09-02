import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThoughtlyLogo } from '@/components/ThoughtlyLogo';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ApiService } from '@/services/api';

interface SidebarHeaderProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export function SidebarHeader({ collapsed, toggleSidebar }: SidebarHeaderProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleNewThread = async () => {
    if (!user) return;

    try {
      // Create new session via backend
      const sessionResponse = await ApiService.createSession(user.id);
      const sessionId = sessionResponse.session_id;

      toast({
        title: "Thread created",
        description: "Starting a new conversation"
      });

      window.location.href = `/thread/${sessionId}`;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Error",
        description: "Failed to create new thread",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="p-4 flex items-center">
        <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "justify-between w-full")}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <ThoughtlyLogo />
            </Link>
          )}
          {collapsed && (
            <Link to="/" className="flex items-center justify-center">
              <Brain className="h-6 w-6 text-thoughtly-accent" />
            </Link>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="rounded-full h-7 w-7" onClick={toggleSidebar}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className={cn("px-3 my-2", collapsed ? "flex justify-center" : "")}>
        <Button 
          className={cn("thoughtly-button w-full gap-2 justify-center", collapsed ? "px-2" : "")} 
          onClick={handleNewThread}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New Thread</span>}
        </Button>
      </div>
    </>
  );
}