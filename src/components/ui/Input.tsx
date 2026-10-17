import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="min-w-0 w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'flex min-h-11 min-w-0 w-full max-w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 focus-visible:border-civic-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-medium break-words">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 break-words">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="min-w-0 w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            'flex min-w-0 w-full max-w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 focus-visible:border-civic-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y break-words',
            error && 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-medium break-words">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 break-words">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
