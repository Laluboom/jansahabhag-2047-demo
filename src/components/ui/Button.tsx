import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'saffron' | 'danger' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex min-w-0 max-w-full items-center justify-center rounded-lg text-center font-medium leading-snug whitespace-normal break-words [&>svg]:shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-transform motion-safe:duration-150';

    const variants = {
      primary:
        'bg-civic-indigo-600 text-white hover:bg-civic-indigo-700 focus-visible:ring-civic-indigo-500 shadow-sm',
      secondary:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-civic-indigo-500',
      ghost:
        'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
      saffron:
        'bg-civic-saffron-600 text-white hover:bg-civic-saffron-700 focus-visible:ring-civic-saffron-500 shadow-sm',
      teal:
        'bg-civic-teal-600 text-white hover:bg-civic-teal-700 focus-visible:ring-civic-teal-500 shadow-sm',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm',
    };

    const sizes = {
      sm: 'min-h-9 px-3.5 py-2 text-xs gap-1.5',
      md: 'min-h-10 px-4 py-2.5 text-sm gap-2',
      lg: 'min-h-12 px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
