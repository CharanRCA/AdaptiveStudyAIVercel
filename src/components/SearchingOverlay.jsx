// SearchingOverlay component
import React from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, BookOpen, Sparkles } from 'lucide-react';

export default function SearchingOverlay({ topic, subTopic }) {
  const steps = [
    { icon: Globe, text: 'Searching state standards database...' },
    { icon: BookOpen, text: `Finding resources for "${subTopic || topic}"...` },
    { icon: Sparkles, text: 'Generating targeted practice problems...' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-card border border-border rounded-2xl p-8 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="inline-flex p-4 rounded-2xl bg-primary/20 mb-6"
      >
        <Search className="w-8 h-8 text-primary" />
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Adaptive Learning Activated</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Searching for standards and generating practice problems to help you master this topic.
      </p>
      <div className="space-y-3 max-w-sm mx-auto">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 1.2 }}
              className="flex items-center gap-3 text-left"
            >
              <div className="p-1.5 rounded-lg bg-accent/20 shrink-0">
                <Icon className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-xs text-muted-foreground">{step.text}</span>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 1.2 + 0.8 }}
                className="ml-auto text-green-400 text-xs"
              >
                ✓
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}