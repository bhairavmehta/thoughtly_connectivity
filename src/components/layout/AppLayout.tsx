
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-thoughtly">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          sidebarCollapsed ? "ml-[70px]" : "ml-64"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
