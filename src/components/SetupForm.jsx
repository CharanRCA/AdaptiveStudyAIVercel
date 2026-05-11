// SetupForm component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, ArrowRight, Zap, Flame, ChevronRight, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const GRADES = [
  'Kindergarten','1st Grade','2nd Grade','3rd Grade','4th Grade',
  '5th Grade','6th Grade','7th Grade','8th Grade',
  '9th Grade','10th Grade','11th Grade','12th Grade',
];

const SUBJECTS = ['Mathematics', 'Science', 'English Language Arts', 'Social Studies'];

// Subtopics per subject
const SUBTOPICS = {
  Mathematics: [
    'Algebra', 'Geometry', 'Fractions & Decimals', 'Statistics & Probability',
    'Number Theory', 'Calculus', 'Trigonometry', 'Linear Equations',
    'Quadratic Equations', 'Functions & Graphs',
  ],
  Science: [
    'Biology', 'Chemistry', 'Physics', 'Earth Science',
    'Ecology', 'Genetics', 'Astronomy', 'Human Body',
    'Chemical Reactions', 'Forces & Motion',
  ],
  'Social Studies': [
    'U.S. History', 'World History', 'Geography', 'Civics & Government',
    'Economics', 'Ancient Civilizations', 'Modern History', 'Political Science',
  ],
};

// ELA focus areas instead of subtopics
const ELA_FOCUS = [
  { id: 'adaptive', label: 'Adaptive (AI chooses)', desc: 'AI adapts to your needs', icon: '🤖' },
  { id: 'Reading Comprehension', label: 'Reading Comprehension', desc: 'Passages + questions', icon: '📖' },
  { id: 'Literary Analysis', label: 'Literary Analysis', desc: 'Themes, symbolism, devices', icon: '🎭' },
  { id: 'Grammar & Mechanics', label: 'Grammar & Mechanics', desc: 'Rules and usage', icon: '✏️' },
  { id: 'Vocabulary', label: 'Vocabulary', desc: 'Words in context', icon: '📝' },
  { id: 'Writing Skills', label: 'Writing Skills', desc: 'Essays and structure', icon: '✍️' },
  { id: 'Poetry', label: 'Poetry', desc: 'Poems and devices', icon: '🎵' },
  { id: 'Informational Text', label: 'Informational Text', desc: 'Non-fiction analysis', icon: '🗞️' },
];

const STATE_STANDARDS = {
  Mathematics: ['Alabama Course of Study – Math','Alaska Math Standards','Arizona Mathematics Standards','Arkansas Mathematics Standards','California Common Core – Math','Colorado Academic Standards – Math','Connecticut Core Standards – Math','Delaware Math Standards','Florida BEST Standards – Math','Georgia Standards of Excellence – Math','Hawaii Common Core – Math','Idaho Content Standards – Math','Illinois Learning Standards – Math','Indiana Academic Standards – Math','Iowa Core – Math','Kansas Math Standards','Kentucky Academic Standards – Math','Louisiana Math Standards','Maine Learning Results – Math','Maryland College & Career Ready – Math','Massachusetts Curriculum Frameworks – Math','Michigan Academic Standards – Math','Minnesota Math Standards','Mississippi College & Career Readiness – Math','Missouri Learning Standards – Math','Montana Common Core – Math','Nebraska Math Standards','Nevada Academic Content Standards – Math','New Hampshire College & Career Ready – Math','New Jersey Student Learning Standards – Math','New Mexico CCSS – Math','New York Next Generation Math Standards','North Carolina Standard Course of Study – Math','North Dakota Math Content Standards','Ohio Learning Standards – Math','Oklahoma Academic Standards – Math','Oregon Math Standards','Pennsylvania Core Standards – Math','Rhode Island Common Core – Math','South Carolina College & Career Ready – Math','South Dakota Math Standards','Tennessee Math Standards','Texas Essential Knowledge and Skills – Math','Utah Core Standards – Math','Vermont Common Core – Math','Virginia Standards of Learning – Math','Washington Math Standards','West Virginia College & Career Readiness – Math','Wisconsin Academic Standards – Math','Wyoming Math Standards'],
  Science: ['Alabama Course of Study – Science','Alaska Science Standards','Arizona Science Standards','Arkansas Science Standards','California Next Generation Science Standards','Colorado Academic Standards – Science','Connecticut Science Frameworks','Delaware Science Standards','Florida BEST Standards – Science','Georgia Standards of Excellence – Science','Hawaii Next Generation Science Standards','Idaho Science Standards','Illinois Learning Standards – Science','Indiana Academic Standards – Science','Iowa Core – Science','Kansas Science Standards','Kentucky Academic Standards – Science','Louisiana Science Standards','Maine Learning Results – Science','Maryland Science Standards','Massachusetts Curriculum Frameworks – Science','Michigan Science Standards','Minnesota Science Standards','Mississippi College & Career Readiness – Science','Missouri Learning Standards – Science','Montana Science Standards','Nebraska Science Standards','Nevada Science Standards','New Hampshire Science Standards','New Jersey Student Learning Standards – Science','New Mexico Science Standards','New York P-12 Science Learning Standards','North Carolina Essential Science Standards','North Dakota Science Content Standards','Ohio Learning Standards – Science','Oklahoma Academic Standards – Science','Oregon Science Standards','Pennsylvania Academic Standards – Science','Rhode Island Science Standards','South Carolina Science Standards','South Dakota Science Standards','Tennessee Science Standards','Texas Essential Knowledge and Skills – Science','Utah Science Standards','Vermont Science Standards','Virginia Standards of Learning – Science','Washington Next Generation Science Standards','West Virginia Science Standards','Wisconsin Academic Standards – Science','Wyoming Science Standards'],
  'English Language Arts': ['Alabama Course of Study – ELA','Alaska ELA Standards','Arizona ELA Standards','Arkansas ELA Standards','California Common Core – ELA','Colorado Academic Standards – ELA','Connecticut Core Standards – ELA','Delaware ELA Standards','Florida BEST Standards – ELA','Georgia Standards of Excellence – ELA','Hawaii Common Core – ELA','Idaho ELA Standards','Illinois Learning Standards – ELA','Indiana Academic Standards – ELA','Iowa Core – ELA','Kansas ELA Standards','Kentucky Academic Standards – ELA','Louisiana ELA Standards','Maine Learning Results – ELA','Maryland ELA Standards','Massachusetts Curriculum Frameworks – ELA','Michigan Academic Standards – ELA','Minnesota ELA Standards','Mississippi College & Career Readiness – ELA','Missouri Learning Standards – ELA','Montana Common Core – ELA','Nebraska ELA Standards','Nevada Academic Content Standards – ELA','New Hampshire ELA Standards','New Jersey Student Learning Standards – ELA','New Mexico CCSS – ELA','New York Next Generation ELA Standards','North Carolina Standard Course of Study – ELA','North Dakota ELA Content Standards','Ohio Learning Standards – ELA','Oklahoma Academic Standards – ELA','Oregon ELA Standards','Pennsylvania Core Standards – ELA','Rhode Island Common Core – ELA','South Carolina College & Career Ready – ELA','South Dakota ELA Standards','Tennessee ELA Standards','Texas Essential Knowledge and Skills – ELA','Utah Core Standards – ELA','Vermont Common Core – ELA','Virginia Standards of Learning – ELA','Washington ELA Standards','West Virginia College & Career Readiness – ELA','Wisconsin Academic Standards – ELA','Wyoming ELA Standards'],
  'Social Studies': ['Alabama Course of Study – Social Studies','Alaska Social Studies Standards','Arizona Social Studies Standards','Arkansas Social Studies Standards','California History-Social Science Standards','Colorado Academic Standards – Social Studies','Connecticut Social Studies Frameworks','Delaware Social Studies Standards','Florida BEST Standards – Social Studies','Georgia Standards of Excellence – Social Studies','Hawaii Social Studies Standards','Idaho Social Studies Standards','Illinois Learning Standards – Social Studies','Indiana Academic Standards – Social Studies','Iowa Core – Social Studies','Kansas Social Studies Standards','Kentucky Academic Standards – Social Studies','Louisiana Social Studies Standards','Maine Learning Results – Social Studies','Maryland Social Studies Standards','Massachusetts Curriculum Frameworks – Social Studies','Michigan Social Studies Standards','Minnesota Social Studies Standards','Mississippi College & Career Readiness – Social Studies','Missouri Learning Standards – Social Studies','Montana Social Studies Standards','Nebraska Social Studies Standards','Nevada Social Studies Standards','New Hampshire Social Studies Standards','New Jersey Student Learning Standards – Social Studies','New Mexico Social Studies Standards','New York Social Studies Framework','North Carolina Essential Standards – Social Studies','North Dakota Social Studies Content Standards','Ohio Learning Standards – Social Studies','Oklahoma Academic Standards – Social Studies','Oregon Social Studies Standards','Pennsylvania Academic Standards – Social Studies','Rhode Island Social Studies Standards','South Carolina Social Studies Standards','South Dakota Social Studies Standards','Tennessee Social Studies Standards','Texas Essential Knowledge and Skills – Social Studies','Utah Core Standards – Social Studies','Vermont Social Studies Standards','Virginia Standards of Learning – Social Studies','Washington Social Studies Standards','West Virginia Social Studies Standards','Wisconsin Academic Standards – Social Studies','Wyoming Social Studies Standards'],
};

export default function SetupForm({ onStart, isLoading, existingSession }) {
  const [grade, setGrade] = useState(existingSession?.grade_level || '');
  const [subject, setSubject] = useState(existingSession?.subject || '');
  const [standard, setStandard] = useState(existingSession?.curriculum || '');
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [elaFocus, setElaFocus] = useState('adaptive');
  const [step, setStep] = useState(1); // 1=grade+subject, 2=standard+topic, 3=start

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: profiles } = useQuery({
    queryKey: ['profile'],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles?.[0];
  const streak = profile?.streak_days || 0;
  const smartScore = profile?.smart_score || 0;

  const handleSubjectChange = (val) => {
    setSubject(val);
    setStandard('');
    setSelectedSubtopics([]);
    setElaFocus('adaptive');
  };

  const toggleSubtopic = (t) => {
    setSelectedSubtopics(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const availableStandards = subject ? (STATE_STANDARDS[subject] || []) : [];
  const availableSubtopics = SUBTOPICS[subject] || [];
  const isELA = subject === 'English Language Arts';

  const canGoStep2 = grade && subject;
  const canStart = grade && subject && standard;

  const handleStart = () => {
    onStart({
      grade,
      curriculum: standard,
      subject,
      subtopics: selectedSubtopics,
      elaFocus: isELA ? elaFocus : null,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/25 pulse-glow">
          <Zap className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-1">NyxLearn</h1>
        <p className="text-muted-foreground text-sm">Adaptive practice that levels up with you.</p>
        <Link to="/practice-tests" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full border border-border bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
          <ClipboardList className="w-3 h-3" /> Take a Practice Test
        </Link>

        {(streak > 0 || smartScore > 0) && (
          <div className="flex items-center justify-center gap-3 mt-4">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/20">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-orange-400">{streak} day streak</span>
              </div>
            )}
            {smartScore > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{smartScore} SmartScore</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border transition-all ${step >= s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
              {s}
            </div>
            {s < 2 && <div className={`h-px w-8 transition-colors ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              {/* Grade */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Grade Level
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                  {GRADES.map(g => (
                    <button key={g} onClick={() => setGrade(g)}
                      className={`rounded-xl py-2 text-xs font-semibold border transition-all ${grade === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                      {g.replace(' Grade', '').replace('Kindergarten', 'K')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Subject
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map(s => (
                    <button key={s} onClick={() => handleSubjectChange(s)}
                      className={`rounded-xl py-2.5 px-3 text-sm font-medium border transition-all ${subject === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(2)} disabled={!canGoStep2} className="w-full h-11 rounded-xl font-semibold text-sm gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              {/* Back + context */}
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{grade} · {subject}</span>
              </div>

              {/* State Standard */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State Standard</label>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-secondary/20 divide-y divide-border">
                  {availableStandards.map(s => (
                    <button key={s} onClick={() => setStandard(s)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${standard === s ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/40'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* ELA Focus */}
              {isELA && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Focus Area</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ELA_FOCUS.map(f => (
                      <button key={f.id} onClick={() => setElaFocus(f.id)}
                        className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${elaFocus === f.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-secondary/30 border-border text-foreground hover:border-primary/30'}`}>
                        <span className="text-lg">{f.icon}</span>
                        <div>
                          <div className="text-xs font-semibold">{f.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Subtopics for non-ELA */}
              {!isELA && availableSubtopics.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Focus Topics <span className="text-muted-foreground/60 normal-case font-normal">(optional — leave blank for all)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubtopics.map(t => (
                      <button key={t} onClick={() => toggleSubtopic(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedSubtopics.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <Button onClick={handleStart} disabled={!canStart || isLoading} className="w-full h-11 rounded-xl font-semibold text-sm gap-2 shadow-lg shadow-primary/20">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{existingSession?.status === 'active' ? 'Resume Session' : 'Start Learning'} <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}