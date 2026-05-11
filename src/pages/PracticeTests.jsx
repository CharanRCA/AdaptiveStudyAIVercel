// PracticeTests page
import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Brain, Trophy, Target, Zap, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import NavBar from '@/components/NavBar';
import BackgroundOrbs from '@/components/BackgroundOrbs';
import { generateQuestion } from '@/lib/aiClient';
import { calculateDifficulty, calculateMasteryScore } from '@/lib/studyEngine';

const GRADES = ['Kindergarten','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'];
const SUBJECTS = ['Mathematics', 'Science', 'English Language Arts', 'Social Studies'];

const ALL_STANDARDS = {
  Mathematics: ['Alabama Course of Study – Math','Alaska Math Standards','Arizona Mathematics Standards','Arkansas Mathematics Standards','California Common Core – Math','Colorado Academic Standards – Math','Connecticut Core Standards – Math','Delaware Math Standards','Florida BEST Standards – Math','Georgia Standards of Excellence – Math','Hawaii Common Core – Math','Idaho Content Standards – Math','Illinois Learning Standards – Math','Indiana Academic Standards – Math','Iowa Core – Math','Kansas Math Standards','Kentucky Academic Standards – Math','Louisiana Math Standards','Maine Learning Results – Math','Maryland College & Career Ready – Math','Massachusetts Curriculum Frameworks – Math','Michigan Academic Standards – Math','Minnesota Math Standards','Mississippi College & Career Readiness – Math','Missouri Learning Standards – Math','Montana Common Core – Math','Nebraska Math Standards','Nevada Academic Content Standards – Math','New Hampshire College & Career Ready – Math','New Jersey Student Learning Standards – Math','New Mexico CCSS – Math','New York Next Generation Math Standards','North Carolina Standard Course of Study – Math','North Dakota Math Content Standards','Ohio Learning Standards – Math','Oklahoma Academic Standards – Math','Oregon Math Standards','Pennsylvania Core Standards – Math','Rhode Island Common Core – Math','South Carolina College & Career Ready – Math','South Dakota Math Standards','Tennessee Math Standards','Texas Essential Knowledge and Skills – Math','Utah Core Standards – Math','Vermont Common Core – Math','Virginia Standards of Learning – Math','Washington Math Standards','West Virginia College & Career Readiness – Math','Wisconsin Academic Standards – Math','Wyoming Math Standards'],
  Science: ['Alabama Course of Study – Science','Alaska Science Standards','Arizona Science Standards','Arkansas Science Standards','California Next Generation Science Standards','Colorado Academic Standards – Science','Connecticut Science Frameworks','Delaware Science Standards','Florida BEST Standards – Science','Georgia Standards of Excellence – Science','Hawaii Next Generation Science Standards','Idaho Science Standards','Illinois Learning Standards – Science','Indiana Academic Standards – Science','Iowa Core – Science','Kansas Science Standards','Kentucky Academic Standards – Science','Louisiana Science Standards','Maine Learning Results – Science','Maryland Science Standards','Massachusetts Curriculum Frameworks – Science','Michigan Science Standards','Minnesota Science Standards','Mississippi College & Career Readiness – Science','Missouri Learning Standards – Science','Montana Science Standards','Nebraska Science Standards','Nevada Science Standards','New Hampshire Science Standards','New Jersey Student Learning Standards – Science','New Mexico Science Standards','New York P-12 Science Learning Standards','North Carolina Essential Science Standards','North Dakota Science Content Standards','Ohio Learning Standards – Science','Oklahoma Academic Standards – Science','Oregon Science Standards','Pennsylvania Academic Standards – Science','Rhode Island Science Standards','South Carolina Science Standards','South Dakota Science Standards','Tennessee Science Standards','Texas Essential Knowledge and Skills – Science','Utah Science Standards','Vermont Science Standards','Virginia Standards of Learning – Science','Washington Next Generation Science Standards','West Virginia Science Standards','Wisconsin Academic Standards – Science','Wyoming Science Standards'],
  'English Language Arts': ['Alabama Course of Study – ELA','Alaska ELA Standards','Arizona ELA Standards','Arkansas ELA Standards','California Common Core – ELA','Colorado Academic Standards – ELA','Connecticut Core Standards – ELA','Delaware ELA Standards','Florida BEST Standards – ELA','Georgia Standards of Excellence – ELA','Hawaii Common Core – ELA','Idaho ELA Standards','Illinois Learning Standards – ELA','Indiana Academic Standards – ELA','Iowa Core – ELA','Kansas ELA Standards','Kentucky Academic Standards – ELA','Louisiana ELA Standards','Maine Learning Results – ELA','Maryland ELA Standards','Massachusetts Curriculum Frameworks – ELA','Michigan Academic Standards – ELA','Minnesota ELA Standards','Mississippi College & Career Readiness – ELA','Missouri Learning Standards – ELA','Montana Common Core – ELA','Nebraska ELA Standards','Nevada Academic Content Standards – ELA','New Hampshire ELA Standards','New Jersey Student Learning Standards – ELA','New Mexico CCSS – ELA','New York Next Generation ELA Standards','North Carolina Standard Course of Study – ELA','North Dakota ELA Content Standards','Ohio Learning Standards – ELA','Oklahoma Academic Standards – ELA','Oregon ELA Standards','Pennsylvania Core Standards – ELA','Rhode Island Common Core – ELA','South Carolina College & Career Ready – ELA','South Dakota ELA Standards','Tennessee ELA Standards','Texas Essential Knowledge and Skills – ELA','Utah Core Standards – ELA','Vermont Common Core – ELA','Virginia Standards of Learning – ELA','Washington ELA Standards','West Virginia College & Career Readiness – ELA','Wisconsin Academic Standards – ELA','Wyoming ELA Standards'],
  'Social Studies': ['Alabama Course of Study – Social Studies','Alaska Social Studies Standards','Arizona Social Studies Standards','Arkansas Social Studies Standards','California History-Social Science Standards','Colorado Academic Standards – Social Studies','Connecticut Social Studies Frameworks','Delaware Social Studies Standards','Florida BEST Standards – Social Studies','Georgia Standards of Excellence – Social Studies','Hawaii Social Studies Standards','Idaho Social Studies Standards','Illinois Learning Standards – Social Studies','Indiana Academic Standards – Social Studies','Iowa Core – Social Studies','Kansas Social Studies Standards','Kentucky Academic Standards – Social Studies','Louisiana Social Studies Standards','Maine Learning Results – Social Studies','Maryland Social Studies Standards','Massachusetts Curriculum Frameworks – Social Studies','Michigan Social Studies Standards','Minnesota Social Studies Standards','Mississippi College & Career Readiness – Social Studies','Missouri Learning Standards – Social Studies','Montana Social Studies Standards','Nebraska Social Studies Standards','Nevada Social Studies Standards','New Hampshire Social Studies Standards','New Jersey Student Learning Standards – Social Studies','New Mexico Social Studies Standards','New York Social Studies Framework','North Carolina Essential Standards – Social Studies','North Dakota Social Studies Content Standards','Ohio Learning Standards – Social Studies','Oklahoma Academic Standards – Social Studies','Oregon Social Studies Standards','Pennsylvania Academic Standards – Social Studies','Rhode Island Social Studies Standards','South Carolina Social Studies Standards','South Dakota Social Studies Standards','Tennessee Social Studies Standards','Texas Essential Knowledge and Skills – Social Studies','Utah Core Standards – Social Studies','Vermont Social Studies Standards','Virginia Standards of Learning – Social Studies','Washington Social Studies Standards','West Virginia Social Studies Standards','Wisconsin Academic Standards – Social Studies','Wyoming Social Studies Standards'],
};

const TEST_LENGTH = 20;

// A quiz card that hides correctness until grading — no immediate feedback
function PracticeQuestionCard({ question, questionNumber, totalQuestions, selectedAnswer, onSelect, onNext }) {
  const isLastQuestion = questionNumber >= totalQuestions;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          Q{questionNumber} of {totalQuestions}
        </span>
        {question?.topic && (
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{question.topic}</span>
        )}
      </div>
      <div className="px-5 py-5 space-y-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{question?.question}</p>
        <div className="space-y-2">
          {(question?.options || []).map((opt, i) => {
            const isSelected = selectedAnswer === opt;
            return (
              <button
                key={i}
                onClick={() => onSelect(opt)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary/15 border-primary/50 text-primary'
                    : 'bg-secondary/40 border-border text-foreground hover:border-primary/30 hover:bg-secondary/60'
                }`}
              >
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${isSelected ? 'border-primary text-primary' : 'border-current'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
        {selectedAnswer && (
          <Button onClick={onNext} className="w-full rounded-xl h-10 text-sm font-semibold gap-2 mt-2">
            {isLastQuestion ? 'Submit Test' : 'Next Question →'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PracticeTests() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('setup');
  const [config, setConfig] = useState({ grade: '', subject: '', standard: '' });
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [results, setResults] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const startTest = async () => {
    if (!config.grade || !config.subject || !config.standard) return;
    setIsGenerating(true);
    setLoadingProgress(0);

    // Generate all questions up front, cycling through topics at varying difficulties
    const difficulties = ['beginner', 'intermediate', 'intermediate', 'advanced', 'advanced', 'mastery'];
    const generated = [];

    for (let i = 0; i < TEST_LENGTH; i++) {
      const difficulty = difficulties[Math.min(Math.floor(i / 3), difficulties.length - 1)];
      const q = await generateQuestion({
        grade: config.grade,
        subject: config.subject,
        curriculum: config.standard,
        topic: null,
        difficulty,
        isRemedial: false,
      });
      generated.push({ ...q, assignedDifficulty: difficulty });
      setLoadingProgress(Math.round(((i + 1) / TEST_LENGTH) * 100));
    }

    setQuestions(generated);
    setUserAnswers(new Array(TEST_LENGTH).fill(null));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsGenerating(false);
    setView('testing');
  };

  const handleSelect = (opt) => setSelectedAnswer(opt);

  const handleNext = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (currentIndex + 1 >= TEST_LENGTH) {
      // Grade everything
      gradeTest(newAnswers);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(newAnswers[currentIndex + 1] || null);
    }
  };

  const gradeTest = async (finalAnswers) => {
    setView('grading');

    const graded = questions.map((q, i) => {
      const userAns = finalAnswers[i];
      const isCorrect = userAns === q.correctAnswer;
      return { ...q, userAnswer: userAns, isCorrect };
    });

    // Build topic scores
    const topicMap = {};
    graded.forEach(q => {
      const t = q.topic || 'General';
      if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0 };
      topicMap[t].total++;
      if (q.isCorrect) topicMap[t].correct++;
    });
    const topicScores = {};
    Object.entries(topicMap).forEach(([t, d]) => {
      topicScores[t] = Math.round((d.correct / d.total) * 100);
    });

    const correctCount = graded.filter(g => g.isCorrect).length;
    const accuracy = Math.round((correctCount / TEST_LENGTH) * 100);
    const letterGrade = accuracy >= 90 ? 'A' : accuracy >= 80 ? 'B' : accuracy >= 70 ? 'C' : accuracy >= 60 ? 'D' : 'F';
    const fakeHistory = graded.map(g => ({ is_correct: g.isCorrect, difficulty: g.assignedDifficulty || 'intermediate' }));
    const masteryScore = calculateMasteryScore(fakeHistory);

    // Update SmartScore per topic for the user
    if (user?.email) {
      const profs = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profs.length > 0) {
        const p = profs[0];
        const existing = p.topic_smart_scores || {};
        const updated = { ...existing };
        Object.entries(topicScores).forEach(([topic, score]) => {
          const key = `${config.subject}:${topic}`;
          const current = updated[key] || 0;
          // Weighted update: new score pushes toward the test result
          const delta = score >= 80 ? 12 : score >= 60 ? 4 : -8;
          updated[key] = Math.max(0, Math.min(100, current + delta));
        });
        base44.entities.UserProfile.update(p.id, {
          topic_smart_scores: updated,
          total_questions_answered: (p.total_questions_answered || 0) + TEST_LENGTH,
          total_correct: (p.total_correct || 0) + correctCount,
        });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    }

    // Save session
    const session = await base44.entities.StudySession.create({
      grade_level: config.grade, curriculum: config.standard, subject: config.subject,
      total_questions: TEST_LENGTH, correct_answers: correctCount,
      mastery_score: masteryScore, difficulty_level: calculateDifficulty(masteryScore),
      topic_scores: topicScores, status: 'completed',
    });

    setResults({ graded, topicScores, correctCount, accuracy, letterGrade, masteryScore });
    setView('results');
  };

  const resetTest = () => {
    setView('setup');
    setQuestions([]);
    setUserAnswers([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setResults(null);
    setLoadingProgress(0);
  };

  const gradeColor = results ? { A: 'text-green-400', B: 'text-blue-400', C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400' }[results.letterGrade] : '';

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundOrbs />
      <NavBar />
      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-20 pb-12">
        <AnimatePresence mode="wait">

          {/* SETUP */}
          {view === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-6">
                <Link to="/study" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Study
                </Link>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-foreground">Practice Tests</h1>
                    <p className="text-sm text-muted-foreground">AI-adaptive · All topics covered · Graded at the end</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                {/* Grade */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade Level</label>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                    {GRADES.map(g => (
                      <button key={g} onClick={() => setConfig(c => ({ ...c, grade: g }))}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${config.grade === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/40'}`}>
                        {g.replace(' Grade', '').replace('Kindergarten', 'K')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBJECTS.map(s => (
                      <button key={s} onClick={() => setConfig(c => ({ ...c, subject: s, standard: '' }))}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${config.subject === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/40'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standard */}
                {config.subject && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State Standard</label>
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-secondary/20 divide-y divide-border">
                      {(ALL_STANDARDS[config.subject] || []).map(s => (
                        <button key={s} onClick={() => setConfig(c => ({ ...c, standard: s }))}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${config.standard === s ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/40'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Info */}
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
                  {[
                    { icon: Target, label: `${TEST_LENGTH} Questions`, color: 'text-primary' },
                    { icon: Brain, label: 'Adaptive Difficulty', color: 'text-accent' },
                    { icon: ClipboardList, label: 'Graded at End', color: 'text-amber-400' },
                    { icon: Zap, label: 'Topic SmartScore', color: 'text-green-400' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
                    </div>
                  ))}
                </div>

                <Button onClick={startTest} disabled={!config.grade || !config.subject || !config.standard || isGenerating}
                  className="w-full h-11 rounded-xl font-semibold gap-2">
                  <ClipboardList className="w-4 h-4" /> Begin Practice Test
                </Button>
              </div>
            </motion.div>
          )}

          {/* GENERATING */}
          {view === 'setup' && isGenerating && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Generating {TEST_LENGTH} questions...</p>
                <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${loadingProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground font-mono">{loadingProgress}%</p>
              </div>
            </motion.div>
          )}

          {/* TESTING */}
          {view === 'testing' && questions[currentIndex] && (
            <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={resetTest} className="text-muted-foreground hover:text-foreground rounded-xl text-sm h-8">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Quit
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">{currentIndex + 1}/{TEST_LENGTH}</span>
                  <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentIndex + 1) / TEST_LENGTH) * 100}%` }} />
                  </div>
                </div>
              </div>
              <PracticeQuestionCard
                key={currentIndex}
                question={questions[currentIndex]}
                questionNumber={currentIndex + 1}
                totalQuestions={TEST_LENGTH}
                selectedAnswer={selectedAnswer}
                onSelect={handleSelect}
                onNext={handleNext}
              />
            </motion.div>
          )}

          {/* GRADING */}
          {view === 'grading' && (
            <motion.div key="grading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Grading your test...</p>
            </motion.div>
          )}

          {/* RESULTS */}
          {view === 'results' && results && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Score card */}
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-card border border-border rounded-2xl p-8 text-center">
                <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h1 className="text-2xl font-extrabold text-foreground mb-1">Test Complete!</h1>
                <p className="text-sm text-muted-foreground mb-6">{config.grade} · {config.subject}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <div className={`text-4xl font-extrabold font-mono ${gradeColor}`}>{results.letterGrade}</div>
                    <div className="text-xs text-muted-foreground mt-1">Grade</div>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <div className="text-4xl font-extrabold font-mono text-foreground">{results.accuracy}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <div className="text-4xl font-extrabold font-mono text-primary">{results.correctCount}/{TEST_LENGTH}</div>
                    <div className="text-xs text-muted-foreground mt-1">Correct</div>
                  </div>
                </div>
              </motion.div>

              {/* Topic SmartScores */}
              {Object.keys(results.topicScores).length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Topic SmartScore Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(results.topicScores).sort(([,a],[,b]) => b - a).map(([topic, score], i) => (
                      <motion.div key={topic} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {score >= 80 ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            <span className="text-xs text-foreground">{topic}</span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-foreground">{score}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.7, delay: i * 0.07 }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewed answers */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Answer Review</h3>
                <div className="space-y-3">
                  {results.graded.map((q, i) => (
                    <div key={i} className={`p-4 rounded-xl border text-sm ${q.isCorrect ? 'bg-green-500/8 border-green-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
                      <div className="flex items-start gap-2 mb-2">
                        {q.isCorrect ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                        <p className="text-foreground font-medium leading-snug">{q.question}</p>
                      </div>
                      {!q.isCorrect && (
                        <div className="ml-6 space-y-1 text-xs">
                          <p className="text-red-400">Your answer: {q.userAnswer || '(no answer)'}</p>
                          <p className="text-green-400">Correct: {q.correctAnswer}</p>
                        </div>
                      )}
                      {q.explanation && (
                        <p className="ml-6 mt-2 text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={resetTest} variant="outline" className="flex-1 rounded-xl">New Test</Button>
                <Link to="/study" className="flex-1">
                  <Button className="w-full rounded-xl gap-2">Back to Study</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}