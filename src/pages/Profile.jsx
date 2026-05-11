import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, BookOpen, Target, ArrowLeft, Star, Zap, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';

export default function Profile() {
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

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: () => base44.entities.StudySession.list('-created_date', 50),
    initialData: [],
  });

  const profile = profiles[0];
  const medals = profile?.medals || [];
  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  const subjectGradients = {
    Mathematics: 'from-blue-500 to-cyan-400',
    Science: 'from-green-500 to-emerald-400',
    'English Language Arts': 'from-purple-500 to-pink-400',
    'Social Studies': 'from-orange-500 to-amber-400',
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-12">

        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{user?.full_name || 'Your Profile'}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Flame, label: 'Day Streak', value: profile?.streak_days || 0, color: 'text-orange-400' },
            { icon: Trophy, label: 'Medals', value: medals.length, color: 'text-amber-400' },
            { icon: BookOpen, label: 'Sessions', value: completedSessions, color: 'text-primary' },
            { icon: Zap, label: 'SmartScore', value: profile?.smart_score || 0, color: 'text-primary' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <Icon className={`w-4 h-4 mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Questions stat */}
        <div className="bg-card border border-border rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <span className="text-sm text-foreground">Questions answered</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-foreground">{profile?.total_questions_answered || 0}</span>
            {(profile?.total_questions_answered || 0) > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.round(((profile?.total_correct || 0) / profile.total_questions_answered) * 100)}% accuracy
              </span>
            )}
          </div>
        </div>

        {/* Topic SmartScores */}
        {profile?.topic_smart_scores && Object.keys(profile.topic_smart_scores).length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Topic SmartScores
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              {Object.entries(profile.topic_smart_scores)
                .sort(([,a],[,b]) => b - a)
                .map(([key, score]) => {
                  const [subject, topic] = key.split(':');
                  const isMastered = score >= 100;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs font-medium text-foreground">{topic}</span>
                          <span className="text-xs text-muted-foreground ml-2">{subject}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isMastered && <Trophy className="w-3 h-3 text-amber-400" />}
                          <span className="text-xs font-mono font-semibold text-foreground">{score}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isMastered ? 'bg-amber-400' : score >= 70 ? 'bg-primary' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Medals */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Earned Medals
          </h2>

          {medals.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <Trophy className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No medals yet — keep studying to earn your first!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {medals.map((medal, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${subjectGradients[medal.subject] || 'from-amber-400 to-yellow-300'} flex items-center justify-center shrink-0`}>
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{medal.standardName || medal.standard}</p>
                    <p className="text-xs text-muted-foreground">{medal.grade} · {medal.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[0, 1, 2].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                    <span className="text-xs text-muted-foreground ml-1">{medal.mastery_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}