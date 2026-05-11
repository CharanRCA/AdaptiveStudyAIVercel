import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NavBar from '@/components/NavBar';
import BackgroundOrbs from '@/components/BackgroundOrbs';

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Get started with the basics.',
    features: ['Basic question practice', '2 subject areas', 'SmartScore tracking', 'Streak system'],
    missing: ['Personal AI assistant', 'Adaptive Learning AI', 'All topics & subjects', 'AI video explanations'],
    cta: 'Start Free',
    href: '/study',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$20',
    period: '/month',
    desc: 'Full adaptive learning experience.',
    features: ['Everything in Free', 'All 4 subjects & all topics', 'Adaptive AI Test mode', 'Personal AI assistant', 'AI video explanations', 'Priority question generation', 'Detailed topic mastery'],
    missing: [],
    cta: 'Start Pro',
    href: '/study',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: "Let's Talk",
    period: '',
    desc: 'For schools and districts.',
    features: ['Everything in Pro', 'Advanced security & SSO', 'Admin dashboard', 'Bulk student accounts', 'Custom curriculum alignment', 'Dedicated support', 'SLA guarantee'],
    missing: [],
    cta: 'Contact Us',
    href: 'mailto:charan@nyxlearn.com',
    highlighted: false,
    isExternal: true,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundOrbs />
      <NavBar />
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center mb-14">
          <h1 className="text-5xl font-extrabold text-foreground tracking-tight mb-4">Simple pricing</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">Start free, upgrade when you're ready. No surprises.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map((plan, i) => (
            <motion.div key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-7 flex flex-col ${plan.highlighted ? 'bg-primary/10 border-primary/40 shadow-2xl shadow-primary/10' : 'bg-card border-border'}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg shadow-primary/30">
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
                {plan.missing.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground/50 line-through">
                    <div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.isExternal ? (
                <a href={plan.href}>
                  <Button className="w-full rounded-xl" variant={plan.highlighted ? 'default' : 'outline'}>{plan.cta}</Button>
                </a>
              ) : (
                <Link to={plan.href}>
                  <Button className="w-full rounded-xl" variant={plan.highlighted ? 'default' : 'outline'}>{plan.cta}</Button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-12">
          <p className="text-sm text-muted-foreground">Questions? <a href="mailto:charan@nyxlearn.com" className="text-primary hover:underline">Contact us</a></p>
        </motion.div>
      </div>
    </div>
  );
}