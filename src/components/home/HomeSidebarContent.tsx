
import React from 'react';
import { motion } from 'framer-motion';
import { SidebarContent } from '@/components/ui/sidebar';
import { SidebarInfoButtons } from './SidebarInfoButtons';

interface HomeSidebarContentProps {
  collapsed?: boolean;
}

export function HomeSidebarContent({ collapsed = false }: HomeSidebarContentProps) {
  return (
    <SidebarContent className="py-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {!collapsed && (
          <div className="px-4 mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-thoughtly-accent to-blue-500 bg-clip-text text-transparent mb-4 animate-fade-in">
              Welcome to Thoughtly
            </h2>
            <p className="text-thoughtly-subtle animate-fade-in transition-all duration-700">
              Your personal AI companion for organizing thoughts and ideas.
            </p>
          </div>
        )}
        
        <SidebarInfoButtons collapsed={collapsed} />
      </motion.div>
    </SidebarContent>
  );
}
