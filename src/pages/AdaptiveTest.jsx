import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Brain, Trophy, Target, Zap, Star, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import NavBar from '@/components/NavBar';
import BackgroundOrbs from '@/components/BackgroundOrbs';
import QuizCard from '@/components/QuizCard';
import MasteryBar from '@/components/MasteryBar';
import { generateQuestion, checkMasteryCompletion } from '@/lib/aiClient';
import { calculateDifficulty, calculateMasteryScore, calculateTopicScores } from '@/lib/studyEngine';

const GRADES = ['3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'];
const SUBJECTS = ['Mathematics', 'Science', 'English Language Arts', 'Social Studies'];
const STATE_STANDARDS_SAMPLE = {
  Mathematics: ['Georgia Standards of Excellence – Math', 'California Common Core – Math', 'Texas Essential Knowledge and Skills – Math', 'New York Next Generation Math Standards', 'Florida BEST Standards – Math'],
  Science: ['Georgia Standards of Excellence – Science', 'California Next Generation Science Standards', 'Texas Essential Knowledge and Skills – Science', 'New York P-12 Science Learning Standards', 'Florida BEST Standards – Science'],
  'English Language Arts': ['Georgia Standards of Excellence – ELA', 'California Common Core – ELA', 'Texas Essential Knowledge and Skills – ELA', 'New York Next Generation ELA Standards', 'Florida BEST Standards – ELA'],
  'Social Studies': ['Georgia Standards of Excellence – Social Studies', 'California History-Social Science Standards', 'Texas Essential Knowledge and Skills – Social Studies', 'New York Social Studies Framework', 'Florida BEST Standards – Social Studies'],
};

// Full standards list
const ALL_STANDARDS = {
  Mathematics: ['Alabama Course of Study – Math','Alaska Math Standards','Arizona Mathematics Standards','Arkansas Mathematics Standards','California Common Core – Math','Colorado Academic Standards – Math','Connecticut Core Standards – Math','Delaware Math Standards','Florida BEST Standards – Math','Georgia Standards of Excellence – Math','Hawaii Common Core – Math','Idaho Content Standards – Math','Illinois Learning Standards – Math','Indiana Academic Standards – Math','Iowa Core – Math','Kansas Math Standards','Kentucky Academic Standards – Math','Louisiana Math Standards','Maine Learning Results – Math','Maryland College & Career Ready – Math','Massachusetts Curriculum Frameworks – Math','Michigan Academic Standards – Math','Minnesota Math Standards','Mississippi College & Career Readiness – Math','Missouri Learning Standards – Math','Montana Common Core – Math','Nebraska Math Standards','Nevada Academic Content Standards – Math','New Hampshire College & Career Ready – Math','New Jersey Student Learning Standards – Math','New Mexico CCSS – Math','New York Next Generation Math Standards','North Carolina Standard Course of Study – Math','North Dakota Math Content Standards','Ohio Learning Standards – Math','Oklahoma Academic Standards – Math','Oregon Math Standards','Pennsylvania Core Standards – Math','Rhode Island Common Core – Math','South Carolina College & Career Ready – Math','South Dakota Math Standards','Tennessee Math Standards','Texas Essential Knowledge and Skills – Math','Utah Core Standards – Math','Vermont Common Core – Math','Virginia Standards of Learning – Math','Washington Math Standards','West Virginia College & Career Readiness – Math','Wisconsin Academic Standards – Math','Wyoming Math Standards'],
  Science: ['Alabama Course of Study – Science','Alaska Science Standards','Arizona Science Standards','Arkansas Science Standards','California Next Generation Science Standards','Colorado Academic Standards – Science','Connecticut Science Frameworks','Delaware Science Standards','Florida BEST Standards – Science','Georgia Standards of Excellence – Science','Hawaii Next Generation Science Standards','Idaho Science Standards','Illinois Learning Standards – Science','Indiana Academic Standards – Science','Iowa Core – Science','Kansas Science Standards','Kentucky Academic Standards – Science','Louisiana Science Standards','Maine Learning Results – Science','Maryland Science Standards','Massachusetts Curriculum Frameworks – Science','Michigan Science Standards','Minnesota Science Standards','Mississippi College & Career Readiness – Science','Missouri Learning Standards – Science','Montana Science Standards','Nebraska Science Standards','Nevada Science Standards','New Hampshire Science Standards','New Jersey Student Learning Standards – Science','New Mexico Science Standards','New York P-12 Science Learning Standards','North Carolina Essential Science Standards','North Dakota Science Content Standards','Ohio Learning Standards – Science','Oklahoma Academic Standards – Science','Oregon Science Standards','Pennsylvania Academic Standards – Science','Rhode Island Science Standards','South Carolina Science Standards','South Dakota Science Standards','Tennessee Science Standards','Texas Essential Knowledge and Skills – Science','Utah Science Standards','Vermont Science Standards','Virginia Standards of Learning – Science','Washington Next Generation Science Standards','West Virginia Science Standards','Wisconsin Academic Standards – Science','Wyoming Science Standards'],
  'English Language Arts': ['Alabama Course of Study – ELA','Alaska ELA Standards','Arizona ELA Standards','Arkansas ELA Standards','California Common Core – ELA','Colorado Academic Standards – ELA','Connecticut Core Standards – ELA','Delaware ELA Standards','Florida BEST Standards – ELA','Georgia Standards of Excellence – ELA','Hawaii Common Core – ELA','Idaho ELA Standards','Illinois Learning Standards – ELA','Indiana Academic Standards – ELA','Iowa Core – ELA','Kansas ELA Standards','Kentucky Academic Standards – ELA','Louisiana ELA Standards','Maine Learning Results – ELA','Maryland ELA Standards','Massachusetts Curriculum Frameworks – ELA','Michigan Academic Standards – ELA','Minnesota ELA Standards','Mississippi College & Career Readiness – ELA','Missouri Learning Standards – ELA','Montana Common Core – ELA','Nebraska ELA Standards','Nevada Academic Content Standards – ELA','New Hampshire ELA Standards','New Jersey Student Learning Standards – ELA','New Mexico CCSS – ELA','New York Next Generation ELA Standards','North Carolina Standard Course of Study – ELA','North Dakota ELA Content Standards','Ohio Learning Standards – ELA','Oklahoma Academic Standards – ELA','Oregon ELA Standards','Pennsylvania Core Standards – ELA','Rhode Island Common Core – ELA','South Carolina College & Career Ready – ELA','South Dakota ELA Standards','Tennessee ELA Standards','Texas Essential Knowledge and Skills – ELA','Utah Core Standards – ELA','Vermont Common Core – ELA','Virginia Standards of Learning – ELA','Washington ELA Standards','West Virginia College & Career Readiness – ELA','Wisconsin Academic Standards – ELA','Wyoming ELA Standards'],
  'Social Studies': ['Alabama Course of Study – Social Studies','Alaska Social Studies Standards','Arizona Social Studies Standards','Arkansas Social Studies Standards','California History-Social Science Standards','Colorado Academic Standards – Social Studies','Connecticut Social Studies Frameworks','Delaware Social Studies Standards','Florida BEST Standards – Social Studies','Georgia Standards of Excellence – Social Studies','Hawaii Social Studies Standards','Idaho Social Studies Standards','Illinois Learning Standards – Social Studies','Indiana Academic Standards – Social Studies','Iowa Core – Social Studies','Kansas Social Studies Standards','Kentucky Academic Standards – Social Studies','Louisiana Social Studies Standards','Maine Learning Results – Social Studies','Maryland Social Studies Standards','Massachusetts Curriculum Frameworks – Social Studies','Michigan Social Studies Standards','Minnesota Social Studies Standards','Mississippi College & Career Readiness – Social Studies','Missouri Learning Standards – Social Studies','Montana Social Studies Standards','Nebraska Social Studies Standards','Nevada Social Studies Standards','New Hampshire Social Studies Standards','New Jersey Student Learning Standards – Social Studies','New Mexico Social Studies Standards','New York Social Studies Framework','North Carolina Essential Standards – Social Studies','North Dakota Social Studies Content Standards','Ohio Learning Standards – Social Studies','Oklahoma Academic Standards – Social Studies','Oregon Social Studies Standards','Pennsylvania Academic Standards – Social Studies','Rhode Island Social Studies Standards','South Carolina Social Studies Standards','South Dakota Social Studies Standards','Tennessee Social Studies Standards','Texas Essential Knowledge and Skills – Social Studies','Utah Core Standards – Social Studies','Vermont Social Studies Standards','Virginia Standards of Learning – Social Studies','Washington Social Studies Standards','West Virginia Social Studies Standards','Wisconsin Academic Standards – Social Studies','Wyoming Social Studies Standards'],
};

export default function AdaptiveTest() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('setup'); // setup | testing | results
  const [config, setConfig] = useState({ grade: '', subject: '', standard: '' });
  const [testSession, setTestSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [prefetchedQ, setPrefetchedQ] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mastery, setMastery] = useState(0);
  const [topicScores, setTopicScores] = useState({});

  const TEST_LENGTH = 15; // Fixed test length for adaptive test

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const prefetchNext = useCallback((grade, subject, standard, masteryScore, topics) => {
    const difficulty = calculateDifficulty(masteryScore);
    const weakTopics = Object.entries(topics || {}).filter(([_, s]) => s < 80).sort(([, a], [, b]) => a - b);
    const targetTopic = weakTopics.length > 0 ? weakTopics[0][0] : null;
    generateQuestion({ grade, subject, curriculum: standard, topic: targetTopic, difficulty, isRemedial: false })
      .then(q => setPrefetchedQ(q))
      .catch(() => {});
  }, []);

  const startTest = async () => {
    if (!config.grade || !config.subject || !config.standard) return;
    setIsGenerating(true);

    const session = await base44.entities.StudySession.create({
      grade_level: config.grade, curriculum: config.standard, subject: config.subject,
      total_questions: 0, correct_answers: 0, mastery_score: 0,
      difficulty_level: 'beginner', topic_scores: {}, status: 'active',
    });
    setTestSession(session);

    const firstQ = await generateQuestion({
      grade: config.grade, subject: config.subject, curriculum: config.standard,
      topic: null, difficulty: 'beginner', isRemedial: false,
    });
    setCurrentQuestion(firstQ);
    setIsGenerating(false);
    setView('testing');
    prefetchNext(config.grade, config.subject, config.standard, 0, {});
  };

  const handleAnswer = async (userAnswer, isCorrect) => {
    const newAnswers = [...answers, { question: currentQuestion.question, correct: isCorrect, topic: currentQuestion.topic, difficulty: currentQuestion.difficulty || calculateDifficulty(mastery) }];
    setAnswers(newAnswers);

    const newQNum = questionNumber + 1;
    setQuestionNumber(newQNum);

    // Save to history
    if (testSession) {
      base44.entities.QuestionHistory.create({
        session_id: testSession.id,
        question_text: currentQuestion.question,
        options: currentQuestion.options || [],
        correct_answer: currentQuestion.correctAnswer,
        user_answer: userAnswer,
        is_correct: isCorrect,
        topic: currentQuestion.topic || '',
        sub_topic: currentQuestion.subTopic || '',
        difficulty: calculateDifficulty(mastery),
        is_remedial: false,
        question_index: newQNum,
      });
    }

    // Recalculate mastery
    const fakeHistory = newAnswers.map(a => ({ is_correct: a.correct, difficulty: a.difficulty || 'beginner' }));
    const newMastery = calculateMasteryScore(fakeHistory);
    const newTopics = {};
    newAnswers.forEach(a => {
      const t = a.topic || 'General';
      if (!newTopics[t]) newTopics[t] = { correct: 0, total: 0 };
      newTopics[t].total++;
      if (a.correct) newTopics[t].correct++;
    });
    const topicPct = {};
    Object.entries(newTopics).forEach(([t, d]) => { topicPct[t] = Math.round((d.correct / d.total) * 100); });
    setMastery(newMastery);
    setTopicScores(topicPct);

    if (testSession) {
      base44.entities.StudySession.update(testSession.id, {
        total_questions: newQNum,
        correct_answers: newAnswers.filter(a => a.correct).length,
        mastery_score: newMastery,
        difficulty_level: calculateDifficulty(newMastery),
        topic_scores: topicPct,
      });
    }

    if (newQNum >= TEST_LENGTH) {
      // End test
      if (testSession) base44.entities.StudySession.update(testSession.id, { status: 'completed' });
      setView('results');
      return;
    }

    // Next question
    if (prefetchedQ) {
      setCurrentQuestion(prefetchedQ);
      setPrefetchedQ(null);
      prefetchNext(config.grade, config.subject, config.standard, newMastery, topicPct);
    } else {
      setIsGenerating(true);
      const difficulty = calculateDifficulty(newMastery);
      const weakTopics = Object.entries(topicPct).filter(([_, s]) => s < 80).sort(([, a], [, b]) => a - b);
      const targetTopic = weakTopics.length > 0 ? weakTopics[0][0] : null;
      const q = await generateQuestion({
        grade: config.grade, subject: config.subject, curriculum: config.standard,
        topic: targetTopic, difficulty, isRemedial: false,
      });
      setCurrentQuestion(q);
      setIsGenerating(false);
      prefetchNext(config.grade, config.subject, config.standard, newMastery, topicPct);
    }
  };

  const correctCount = answers.filter(a => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const grade = accuracy >= 90 ? 'A' : accuracy >= 80 ? 'B' : accuracy >= 70 ? 'C' : accuracy >= 60 ? 'D' : 'F';
  const gradeColor = { A: 'text-green-400', B: 'text-blue-400', C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400' }[grade];

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundOrbs />
      <NavBar />
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-20 pb-12">

        <AnimatePresence mode="wait">
          {/* SETUP */}
          {view === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
              <div className="mb-8">
                <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Link>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-foreground">Adaptive AI Test</h1>
                    <p className="text-sm text-muted-foreground">15 questions that adapt to your ability in real time</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                {/* Grade */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade Level</label>
                  <div className="grid grid-cols-5 gap-2">
                    {GRADES.map(g => (
                      <button key={g} onClick={() => setConfig(c => ({ ...c, grade: g }))}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${config.grade === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/40'}`}>
                        {g.replace(' Grade', '')}
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

                {/* State Standard */}
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

                {/* Test info */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
                  {[{ icon: Target, label: '15 Questions', color: 'text-primary' }, { icon: Brain, label: 'Adaptive Difficulty', color: 'text-accent' }, { icon: Zap, label: 'SmartScore Rated', color: 'text-amber-400' }].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
                    </div>
                  ))}
                </div>

                <Button onClick={startTest} disabled={!config.grade || !config.subject || !config.standard || isGenerating} className="w-full h-11 rounded-xl font-semibold gap-2">
                  {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Brain className="w-4 h-4" /> Begin Adaptive Test</>}
                </Button>
              </div>
            </motion.div>
          )}

          {/* TESTING */}
          {view === 'testing' && (
            <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => { setView('setup'); setAnswers([]); setQuestionNumber(0); setMastery(0); }} className="text-muted-foreground hover:text-foreground rounded-xl text-sm h-8">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Quit Test
                </Button>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground font-mono">{questionNumber}/{TEST_LENGTH}</div>
                  <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(questionNumber / TEST_LENGTH) * 100}%` }} />
                  </div>
                </div>
              </div>

              <MasteryBar score={mastery} difficulty={calculateDifficulty(mastery)} totalQuestions={questionNumber} correctAnswers={answers.filter(a => a.correct).length} />

              <div className="mt-5">
                {isGenerating ? (
                  <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full mb-3" />
                    <p className="text-sm text-muted-foreground">Adapting to your level...</p>
                  </div>
                ) : currentQuestion ? (
                  <QuizCard
                    key={`test-${questionNumber}`}
                    question={currentQuestion}
                    onAnswer={handleAnswer}
                    isRemedial={false}
                    questionNumber={questionNumber + 1}
                    remedialIndex={0}
                    remedialTotal={0}
                  />
                ) : null}
              </div>
            </motion.div>
          )}

          {/* RESULTS */}
          {view === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              {/* Grade card */}
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-card border border-border rounded-2xl p-8 text-center mb-6">
                <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                <h1 className="text-2xl font-extrabold text-foreground mb-1">Test Complete!</h1>
                <p className="text-sm text-muted-foreground mb-6">{config.grade} · {config.subject} · {config.standard}</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <div className={`text-4xl font-extrabold font-mono ${gradeColor}`}>{grade}</div>
                    <div className="text-xs text-muted-foreground mt-1">Letter Grade</div>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <div className="text-4xl font-extrabold font-mono text-foreground">{accuracy}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <div className="text-4xl font-extrabold font-mono text-primary">{mastery}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Mastery Score</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {correctCount} / {answers.length} questions correct
                </div>
              </motion.div>

              {/* Topic breakdown */}
              {Object.keys(topicScores).length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Topic Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(topicScores).map(([topic, score], i) => (
                      <motion.div key={topic} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {score >= 80 ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            <span className="text-xs text-foreground">{topic}</span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-foreground">{score}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => { setView('setup'); setAnswers([]); setQuestionNumber(0); setMastery(0); setTopicScores({}); setCurrentQuestion(null); }} variant="outline" className="flex-1 rounded-xl">
                  New Test
                </Button>
                <Link to="/study" className="flex-1">
                  <Button className="w-full rounded-xl gap-2">
                    Practice Weak Topics <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}