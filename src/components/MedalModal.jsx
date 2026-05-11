// MedalModal component
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MedalModal({ medal, onClose }) {
  useEffect(() => {
    if (!medal) return;
    // Simple confetti via CSS animation fallback since canvas-confetti may not be installed
    const colors = ['#a78bfa', '#22d3ee', '#fbbf24', '#34d399', '#f472b6'];
    try {
      // Try canvas-confetti if available
      import('canvas-confetti').then(({ default: confetti }) => {
        const fire = (angle, origin) =>
          confetti({ particleCount: 60, spread: 70, angle, origin, colors });
        setTimeout(() => {
          fire(60, { x: 0, y: 0.6 });
          fire(120, { x: 1, y: 0.6 });
        }, 200);
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 100, origin: { x: 0.5, y: 0.4 }, colors });
        }, 600);
      }).catch(() => {});
    } catch {}
  }, [medal]);

  if (!medal) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="medal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          key="medal-card"
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>

          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-amber-500/30 mb-6"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          <div className="flex justify-center gap-1 mb-4">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </motion.div>
            ))}
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            Standard Mastered!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-muted-foreground mb-1"
          >
            {medal.standardName}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-muted-foreground mb-6"
          >
            {medal.message}
          </motion.p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{medal.grade}</span>
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">{medal.subject}</span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">{medal.mastery_score}% mastery</span>
          </div>

          <Button onClick={onClose} className="w-full rounded-xl">
            Awesome! Keep going
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}