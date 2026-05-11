import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, BookOpen, Brain, Trophy, ArrowRight, Flame, Target, Sparkles, MessageCircle, Mail, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const FEATURES = [
  { icon: Brain, title: 'Adaptive AI Engine', desc: 'Questions get harder as you improve. The AI targets exactly what you need to work on.', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: BookOpen, title: 'ELA Passage Reading', desc: 'Full reading comprehension with side-by-side passage view — just like standardized tests.', color: 'text-accent', bg: 'bg-accent/10' },
  { icon: Trophy, title: 'Standards Mastery', desc: 'Earn medals when you master a standard. Track every topic across all 50 state curricula.', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { icon: Target, title: 'SmartScore System', desc: 'A 0–100 score that reflects your real ability — not just how many you got right.', color: 'text-green-400', bg: 'bg-green-400/10' },
];

const SUBJECTS = [
  { name: 'Mathematics', img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=80&h=80&fit=crop&auto=format', gradient: 'from-blue-500 to-cyan-400' },
  { name: 'Science', img: 'https://images.unsplash.com/photo-1532094349884-543559243f11?w=80&h=80&fit=crop&auto=format', gradient: 'from-green-500 to-emerald-400' },
  { name: 'English Language Arts', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=80&h=80&fit=crop&auto=format', gradient: 'from-purple-500 to-pink-400' },
  { name: 'Social Studies', img: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=80&h=80&fit=crop&auto=format', gradient: 'from-orange-500 to-amber-400' },
];

// Simple fade-in wrapper — no heavy spring or parallax
const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function Landing() {
  const [activeQ, setActiveQ] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    const t = setInterval(() => setActiveQ(p => (p + 1) % 3), 3500);
    return () => clearInterval(t);
  }, []);

  const demoQ = [
    { topic: 'Algebra', q: 'Solve for x: 3x + 7 = 22', answer: 'x = 5' },
    { topic: 'Inference', q: "What can you infer about the author's attitude toward industrial development?", answer: 'Critical of environmental consequences' },
    { topic: "Newton's Laws", q: 'A 5kg object accelerates at 4 m/s². What force was applied?', answer: 'F = 20 N' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Static background — no animation on the orbs to avoid lag */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg text-foreground tracking-tight">NyxLearn</span>
        </div>
        <div className="flex items-center gap-4">
          {!user && <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>}
          <Link to="/study">
            <Button size="sm" className="rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
              Start Learning <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Adaptive Learning — K through 12
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-foreground tracking-tighter leading-[1.02] mb-6">
            Learn smarter.<br />
            <span className="gradient-text">Score higher.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            NyxLearn adapts to exactly where you are. Harder questions when you're ready,
            targeted practice when you're stuck — aligned to your state's standards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/study">
              <Button size="lg" className="h-12 px-8 rounded-2xl font-semibold text-base gap-2 shadow-xl shadow-primary/25">
                Start Learning <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/practice-tests">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-2xl font-semibold text-base gap-2 border-primary/30 hover:bg-primary/5">
                Practice Tests
              </Button>
            </Link>
          </div>

          {/* Demo card — CSS transition only, no framer-motion on per-frame updates */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-0 bg-primary/8 blur-2xl rounded-3xl scale-95" />
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/20">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium transition-all duration-300">{demoQ[activeQ].topic}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">Live Demo</span>
              </div>
              <div className="px-6 py-6 min-h-[180px]">
                <p className="text-base font-medium text-foreground mb-5 leading-relaxed transition-all duration-300">
                  {demoQ[activeQ].q}
                </p>
                <div className="space-y-2.5">
                  {['A', 'B', 'C', 'D'].map((l, i) => (
                    <div key={l} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${i === 1 ? 'bg-green-500/15 border-green-500/40 text-green-300' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
                      <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 border-current">{l}</span>
                      {i === 1 ? demoQ[activeQ].answer : i === 0 ? 'A plausible distractor' : i === 2 ? 'Another common mistake' : 'One more option'}
                      {i === 1 && <span className="ml-auto text-green-400 text-xs">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-1.5 pb-4">
                {demoQ.map((_, i) => (
                  <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: i === activeQ ? 16 : 6, backgroundColor: i === activeQ ? 'hsl(var(--primary))' : 'hsl(var(--border))' }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-2 mt-12">
          <span className="text-xs text-muted-foreground">Scroll to explore</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-y border-border bg-card/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
          {[
            { value: '50', label: 'State Standards', icon: Target },
            { value: 'K–12', label: 'All Grade Levels', icon: BookOpen },
            { value: '100', label: 'Max SmartScore', icon: Zap },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <FadeIn key={s.label} delay={i * 0.08}>
                <Icon className="w-4 h-4 text-primary mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-foreground font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* Subjects */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 border-b border-border">
        <FadeIn className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">Four subjects. All 50 states.</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Aligned to every state standard, from kindergarten through 12th grade.</p>
        </FadeIn>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBJECTS.map((s, i) => (
            <FadeIn key={s.name} delay={i * 0.08}>
              <Link to="/study" className="block group">
                <div className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/40 transition-colors duration-200 relative overflow-hidden">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden`}>
                    <img src={s.img} alt={s.name} className="w-full h-full object-cover opacity-90" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 border-b border-border">
        <FadeIn className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">Built for real learning</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Not just flashcards. NyxLearn uses AI to understand how you think.</p>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn key={f.title} delay={i * 0.08}>
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors duration-200">
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <FadeIn>
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-14 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg shadow-primary/30">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">Ready to level up?</h2>
            <p className="text-muted-foreground mb-10 max-w-sm mx-auto">Start your first adaptive session today. No credit card required.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/study">
                <Button size="lg" className="h-12 px-10 rounded-2xl font-semibold text-base gap-2 shadow-xl shadow-primary/25">
                  Start Learning <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/practice-tests">
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-2xl font-semibold text-base gap-2 border-primary/30">
                  Practice Tests
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm text-foreground">NyxLearn</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://discord.gg/nyxlearn" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#7289da] text-sm font-medium hover:bg-[#5865F2]/25 transition-colors">
                <MessageCircle className="w-4 h-4" /> Discord
              </a>
              <a href="mailto:charan@nyxlearn.com"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                <Mail className="w-4 h-4" /> Email
              </a>
              <a href="https://charanr.dev" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 transition-colors">
                <User className="w-4 h-4" /> Portfolio
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              AI-powered adaptive learning for every student. &nbsp;·&nbsp;
              <span className="text-foreground font-medium">Owned by Charan R</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}