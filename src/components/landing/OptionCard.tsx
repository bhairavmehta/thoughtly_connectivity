
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OptionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  className?: string;
}

export function OptionCard({ icon: Icon, title, description, to, className }: OptionCardProps) {
  return (
    <Link 
      to={to}
      className={cn(
        "thoughtly-option-card group flex flex-col items-start transition-all duration-300",
        className
      )}
    >
      <div className="mb-4 p-3 bg-thoughtly-accent/10 rounded-lg text-thoughtly-accent group-hover:bg-thoughtly-accent/20 transition-all duration-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium mb-2 text-white group-hover:text-thoughtly-accent transition-colors duration-300">{title}</h3>
      <p className="text-sm text-thoughtly-subtle">{description}</p>
    </Link>
  );
}
