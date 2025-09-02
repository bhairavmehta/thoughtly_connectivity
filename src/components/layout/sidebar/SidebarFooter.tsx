
import React from 'react';
import { ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SidebarFooterProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export function SidebarFooter({
  collapsed,
  toggleSidebar
}: SidebarFooterProps) {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    toast({
      title: "Profile",
      description: "Profile page coming soon!"
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn("p-3 border-t border-thoughtly-border", collapsed ? "flex justify-center" : "")}>
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-thoughtly-muted transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                          {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-thoughtly-card border-thoughtly-border text-white">
                    <DropdownMenuItem className="flex items-center cursor-pointer" onClick={handleProfileClick}>
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-thoughtly-border" />
                    <DropdownMenuItem className="flex items-center text-red-400 cursor-pointer" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{user?.email || 'User'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-start gap-2 h-auto w-auto py-1 px-2 hover:bg-thoughtly-muted transition-colors rounded-lg group">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                    {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <div className="text-sm font-medium group-hover:text-white truncate max-w-[100px]">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-thoughtly-subtle group-hover:text-gray-300 truncate max-w-[100px]">
                    {user?.email?.split('@')[1] || ''}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-thoughtly-card border-thoughtly-border text-white">
              <DropdownMenuItem className="flex items-center cursor-pointer" onClick={handleProfileClick}>
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-thoughtly-border" />
              <DropdownMenuItem className="flex items-center text-red-400 cursor-pointer" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="rounded-full h-8 w-8 hover:bg-thoughtly-muted mb-2">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex gap-2">
            
          </div>
        )}
      </div>
    </div>
  );
}
