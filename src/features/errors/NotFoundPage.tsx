import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-5 border-slate-200 shadow-md">
        <div className="w-16 h-16 rounded-2xl bg-civic-indigo-50 text-civic-indigo-600 flex items-center justify-center mx-auto border border-civic-indigo-100">
          <Compass className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Error 404
          </span>
          <h1 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            Path Not Found
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            The civic route or resource you are looking for does not exist in this demo build.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="md" variant="primary" className="w-full">
              <Home className="w-4 h-4 mr-1.5" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
          <Link to="/demo-login" className="w-full sm:w-auto">
            <Button size="md" variant="outline" className="w-full">
              <span>Persona Selector</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
