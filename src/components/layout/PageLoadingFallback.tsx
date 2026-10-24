import React from 'react';

export const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading page content">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
  </div>
);
