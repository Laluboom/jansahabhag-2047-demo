import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'teal' | 'saffron' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-civic-indigo-50 text-civic-indigo-700 border-civic-indigo-200',
    teal: 'bg-civic-teal-50 text-civic-teal-700 border-civic-teal-200',
    saffron: 'bg-civic-saffron-50 text-civic-saffron-800 border-civic-saffron-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
