import React from 'react';
import { motion } from 'framer-motion';

const DIFFICULTY_COLORS = {
  beginner: 'bg-blue-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-orange-500',
  mastery: 'bg-green-500',
};

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  mastery: 'Mastery',
};

export default function MasteryBar({ score, difficulty, totalQuestions, correctAnswers }) {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const barColor = DIFFICULTY_COLORS[difficulty] || 'bg-primary';

  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Mastery</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary`}>
            {DIFFICULTY_LABELS[difficulty] || difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{correctAnswers}/{totalQuestions} correct</span>
          <span className="font-mono font-semibold text-foreground">{score}%</span>
        </div>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {totalQuestions > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">{accuracy}% accuracy this session</div>
      )}
    </div>
  );
}