
import React, { useState } from 'react';
import { HelpCircle, Info, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  collapsed: boolean;
  isActive: boolean;
  onClick: () => void;
}

const InfoButton = ({ icon, title, description, collapsed, isActive, onClick }: InfoButtonProps) => (
  <div 
    className={cn(
      "group flex items-center gap-3 p-3 rounded-lg transition-all duration-700 ease-out",
      "hover:bg-thoughtly-card/70 cursor-pointer",
      isActive ? "bg-thoughtly-card/70 border-l-2 border-thoughtly-accent" : "",
      collapsed ? "justify-center w-10 h-10" : "w-full"
    )}
    onClick={onClick}
  >
    <div className={cn(
      "shrink-0 transition-colors duration-700 ease-out", 
      isActive ? "text-thoughtly-accent" : "text-thoughtly-subtle",
      "group-hover:text-thoughtly-accent"
    )}>
      {icon}
    </div>
    {!collapsed && (
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-medium transition-colors duration-700 ease-out", 
          isActive ? "text-thoughtly-accent" : "text-thoughtly-foreground",
          "group-hover:text-thoughtly-accent"
        )}>
          {title}
        </h3>
        {isActive && (
          <p className="text-sm text-thoughtly-subtle mt-1 animate-fade-in">
            {description}
          </p>
        )}
      </div>
    )}
  </div>
);

interface SidebarInfoButtonsProps {
  collapsed: boolean;
}

export function SidebarInfoButtons({ collapsed }: SidebarInfoButtonsProps) {
  const [activeItem, setActiveItem] = useState<number | null>(null);

  const infoItems = [
    {
      icon: <Info className="h-5 w-5" />,
      title: "What?",
      description: "Thoughtly helps you organize and visualize your ideas with AI assistance. Perfect for capturing and developing your creative thoughts."
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Why?",
      description: "Because we want your creative ideas to flourish. Thoughtly gives your thinking process the AI boost it needs to see the rising sun of possibility."
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "How?",
      description: "Using cutting-edge AI technology, Thoughtly organizes your thoughts into coherent structures, helping you make connections you might otherwise miss."
    }
  ];

  const handleClick = (index: number) => {
    setActiveItem(activeItem === index ? null : index);
  };

  return (
    <div className="space-y-1 px-4 animate-fade-in">
      {infoItems.map((item, index) => (
        <InfoButton
          key={index}
          icon={item.icon}
          title={item.title}
          description={item.description}
          collapsed={collapsed}
          isActive={activeItem === index}
          onClick={() => handleClick(index)}
        />
      ))}
    </div>
  );
}
