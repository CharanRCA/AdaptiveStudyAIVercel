// SessionSidebar component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Flame, Award, CheckCircle, AlertTriangle } from 'lucide-react';

// SmartScore + Streak + Session Stats + Topic Mastery — all in one sidebar
export default function SessionSidebar({ profile, session, questionCount, smartScoreDelta, topicScores }) {
  const score = profile?.smart_score || 0;
  const streak = profile?.streak_days || 0;
  const accuracy = session?.total_questions > 0
    ? Math.round((session.correct_answers / session.total_questions) * 100)
    : 0;
  const topicEntries = Object.entries(topicScores || {});

  return (
    <div className="space-y-4">
      {/* SmartScore */}
      <div className="bg-card border border-border rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">SmartScore</span>
          </div>
          <AnimatePresence>
            {smartScoreDelta !== 0 && (
              <motion.span
                key={smartScoreDelta}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs font-semibold ${smartScoreDelta > 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {smartScoreDelta > 0 ? `+${smartScoreDelta}` : smartScoreDelta}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="text-3xl font-extrabold text-foreground font-mono">{score}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{profile?.total_questions_answered || 0} questions answered</div>
        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${Math.min(100, (score / 1000) * 100)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Target, label: 'Questions', value: questionCount, color: 'text-primary' },
          { icon: Flame, label: 'Accuracy', value: `${accuracy}%`, color: 'text-accent' },
          { icon: Award, label: 'Mastery', value: `${session?.mastery_score || 0}%`, color: 'text-amber-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-3 text-center"
            >
              <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <div className="text-lg font-bold text-foreground font-mono">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Topic Mastery */}
      {topicEntries.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Topic Mastery</h3>
          <div className="space-y-3">
            {topicEntries.map(([topic, score], i) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {score >= 80
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                    }
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{topic}</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-foreground">{score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}