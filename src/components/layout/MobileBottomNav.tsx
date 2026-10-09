import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Vote, Target, Award } from 'lucide-react';
import { cn } from '../../utils/cn';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/learn', label: 'Learn', icon: BookOpen },
    { to: '/assemblies', label: 'Deliberate', icon: Vote },
    { to: '/projects', label: 'Act', icon: Target },
    { to: '/passport', label: 'Passport', icon: Award },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-civic-indigo-500',
                isActive
                  ? 'text-civic-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
