import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  className,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const getInitials = (name?: string) => {
    if (!name) return 'JS';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-civic-indigo-100 text-civic-indigo-700 font-medium select-none flex-shrink-0 border border-slate-200 shadow-2xs',
        sizes[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(fallback || alt)}</span>
      )}
    </div>
  );
};
