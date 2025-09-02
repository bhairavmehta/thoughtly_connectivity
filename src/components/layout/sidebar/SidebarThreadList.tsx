import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Home, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCachedThreads } from '@/hooks/conversation/useCachedThreads';
import { useToast } from '@/hooks/use-toast';

type Thread = {
  id: string;
  title: string;
  updatedAt: string;
  lastMessage?: string;
};

interface SidebarThreadListProps {
  collapsed: boolean;
}

export function SidebarThreadList({ collapsed }: SidebarThreadListProps) {
  const { threads: chatHistory, isLoading, error, refreshThreads } = useCachedThreads();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

      if (diffInHours < 24) {
        return format(date, 'h:mm a');
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else if (diffInHours < 168) {
        return format(date, 'EEEE');
      } else {
        return format(date, 'MMM d');
      }
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Unknown';
    }
  };

  // Process thread data for display, only create title from message if no title exists
  const recentThreads: Thread[] = chatHistory && chatHistory.length > 0 
    ? chatHistory
        .filter(thread => thread.session_id)
        .map((thread) => {
          let displayTitle = thread.thread_title?.trim();
          
          // Only create custom title if no title exists or if it's "Untitled Conversation"
          if (!displayTitle || displayTitle === "Untitled Conversation") {
            if (thread.last_message) {
              const words = thread.last_message.split(' ');
              const firstFewWords = words.slice(0, 5).join(' ');
              displayTitle = `${firstFewWords}${words.length > 5 ? '...' : ''}`;
            } else {
              displayTitle = 'New Conversation';
            }
          }
          
          return {
            id: thread.session_id,
            title: displayTitle,
            lastMessage: thread.last_message,
            updatedAt: formatTimestamp(thread.timestamp)
          };
        })
    : [];

  console.log('Recent threads in sidebar:', recentThreads);

  const mainNavItems = [{
    icon: Home,
    label: 'Home',
    path: '/'
  }];

  // Refresh threads when on home page
  useEffect(() => {
    if (location.pathname === '/') {
      console.log('On home page, refreshing threads');
      refreshThreads();
    }
  }, [location.pathname, refreshThreads]);

  // Handle thread click - prevent reloading same thread
  const handleThreadClick = (threadId: string, event: React.MouseEvent) => {
    if (location.pathname === `/thread/${threadId}`) {
      event.preventDefault();
      return;
    }
    
    navigate(`/thread/${threadId}`);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    toast({
      title: "Refreshing threads",
      description: "Getting the latest threads from the server...",
    });
    await refreshThreads();
  };

  // Loading state UI
  const renderLoadingState = () => (
    <div className="space-y-2 px-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );

  // Error state UI
  const renderErrorState = () => (
    <Alert variant="destructive" className="mx-3">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {error}
      </AlertDescription>
    </Alert>
  );

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="space-y-1">
        {mainNavItems.map(item => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                location.pathname === item.path
                  ? "bg-thoughtly-accent/10 text-thoughtly-accent"
                  : "text-gray-300 hover:bg-thoughtly-muted hover:text-white",
                collapsed ? "justify-center" : ""
              )}
            >
              <item.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>

      {!collapsed && (
        <>
          <div className="mt-6 mb-2">
            <div className="px-3 text-xs font-medium text-thoughtly-subtle uppercase tracking-wider flex justify-between items-center">
              <span>Recent Threads</span>
              <div className="flex items-center gap-1">
                {!isLoading && !error && recentThreads.length > 0 && (
                  <span className="text-xs text-thoughtly-subtle bg-thoughtly-muted/50 px-1.5 py-0.5 rounded">
                    {recentThreads.length}
                  </span>
                )}
                <button 
                  onClick={handleRefresh} 
                  className="text-thoughtly-subtle hover:text-white p-1 rounded-full transition-colors" 
                  title="Refresh threads"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            </div>

            {isLoading && renderLoadingState()}
            {error && renderErrorState()}

            {!isLoading && !error && recentThreads.length > 0 && (
              <ul className="mt-2 space-y-1">
                {recentThreads.map(thread => {
                  const isActive = location.pathname === `/thread/${thread.id}`;
                  
                  return (
                    <li key={thread.id}>
                      <Link
                        to={`/thread/${thread.id}`}
                        onClick={(e) => handleThreadClick(thread.id, e)}
                        className={cn(
                          "flex flex-col gap-1 px-3 py-2 text-sm rounded-lg transition-colors",
                          isActive 
                            ? "bg-thoughtly-accent/10 text-white" 
                            : "text-gray-300 hover:bg-thoughtly-muted hover:text-white"
                        )}
                      >
                        <span className="truncate font-medium">{thread.title}</span>
                        <span className="text-xs text-thoughtly-subtle truncate">
                          {thread.lastMessage ? `${thread.lastMessage.substring(0, 30)}${thread.lastMessage.length > 30 ? '...' : ''} • ` : ''}{thread.updatedAt}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {!isLoading && !error && recentThreads.length === 0 && (
              <div className="px-3 py-2 text-sm text-thoughtly-subtle">
                No recent threads
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
