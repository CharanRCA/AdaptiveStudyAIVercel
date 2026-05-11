// NavBar component
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, User, Flame, Bot, ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NavBar() {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles } = useQuery({
    queryKey: ['profile'],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles[0];
  const streak = profile?.streak_days || 0;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-foreground text-sm tracking-tight">NyxLearn</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/practice-tests"
            className={`text-xs transition-colors hidden sm:block ${location.pathname === '/practice-tests' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Practice Tests
          </Link>
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5" />
              {streak}
            </div>
          )}
          {location.pathname === '/study' && (
            <Link
              to="/assistant"
              className="flex items-center justify-center w-8 h-8 rounded-full border transition-colors border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
              title="AI Tutor"
            >
              <Bot className="w-3.5 h-3.5" />
            </Link>
          )}
          <Link
            to="/profile"
            className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
              location.pathname === '/profile'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            <User className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}