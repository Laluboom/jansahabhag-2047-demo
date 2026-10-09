import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '../stores/authStore';

export const App: React.FC = () => {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-civic-indigo-600 via-civic-teal-500 to-civic-saffron-500 flex items-center justify-center text-white font-bold font-heading text-lg shadow-lg animate-pulse">
          JS
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-civic-saffron-400" />
          <span>Loading JanSahabhag 2047...</span>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
};

export default App;
