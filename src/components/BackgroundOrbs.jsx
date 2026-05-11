import React from 'react';

export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-full h-px bg-border" />
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/4 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/3 blur-3xl" />
    </div>
  );
}