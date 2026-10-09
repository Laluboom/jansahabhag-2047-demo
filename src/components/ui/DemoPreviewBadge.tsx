import React from 'react';
import { cn } from '../../utils/cn';
import { Eye } from 'lucide-react';

interface DemoPreviewBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'banner';
  label?: string;
  description?: string;
}

export const DemoPreviewBadge: React.FC<DemoPreviewBadgeProps> = ({
  className,
  size = 'md',
  label = 'Demo Preview',
  description,
}) => {
  if (size === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3.5 rounded-xl border border-civic-saffron-200 bg-civic-saffron-50 text-civic-saffron-900',
          className
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-civic-saffron-100 flex items-center justify-center text-civic-saffron-700">
          <Eye className="w-4 h-4" />
        </div>
        <div className="flex-1 text-sm">
          <span className="font-semibold">{label}: </span>
          <span>{description || 'This module represents a forward-looking product capability. Controls are simulated for presentation purposes.'}</span>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-md uppercase tracking-wider',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs',
        className
      )}
    >
      <Eye className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
