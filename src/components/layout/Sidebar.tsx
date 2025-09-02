
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarThreadList } from './sidebar/SidebarThreadList';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { HomeSidebarContent } from '../home/HomeSidebarContent';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 h-full z-40 transition-all duration-300 bg-thoughtly-card border-r border-thoughtly-border flex flex-col",
      collapsed ? "w-[70px]" : "w-64"
    )}>
      <SidebarHeader collapsed={collapsed} toggleSidebar={toggleSidebar} />
      {isHome ? (
        <HomeSidebarContent collapsed={collapsed} />
      ) : (
        <SidebarThreadList collapsed={collapsed} />
      )}
      <SidebarFooter collapsed={collapsed} toggleSidebar={toggleSidebar} />
    </div>
  );
}
