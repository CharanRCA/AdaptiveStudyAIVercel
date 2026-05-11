import React, { useState, useCallback, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Zap, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

import BackgroundOrbs from '@/components/BackgroundOrbs';
import SetupForm from '@/components/SetupForm';
import QuizCard from '@/components/QuizCard';
import MasteryBar from '@/components/MasteryBar';
import SearchingOverlay from '@/components/SearchingOverlay';
import MedalModal from '@/components/MedalModal';
import NavBar from '@/components/NavBar';
import SessionSidebar from '@/components/SessionSidebar';

import { generateQuestion, searchStandards, checkMasteryCompletion } from '@/lib/aiClient';
import { calculateDifficulty, calculateMasteryScore, calculateTopicScores } from '@/lib/studyEngine';

// XP milestone messages
const XP_MILESTONES = [10, 25, 50, 100, 200, 500];

export default function Study() {
  const queryClient = useQueryClient();

  const [view, setView] = useState('setup');
  const [session, setSession] = useState(null);
  const [sessionParams, setSessionParams] = useState(null); // stores subtopics, elaFocus
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [prefetchedQuestion, setPrefetchedQuestion] = useState(null); // background prefetch
  const [questionQueue, setQuestionQueue] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isRemedial, setIsRemedial] = useState(false);
  const [remedialIndex, setRemedialIndex] = useState(0);
  const [remedialTotal, setRemedialTotal] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicScores, setTopicScores] = useState({});
  const [setupLoading, setSetupLoading] = useState(false);
  const [earnedMedal, setEarnedMedal] = useState(null);
  const [smartScoreDelta, setSmartScoreDelta] = useState(0);

  // Gamification
  const [combo, setCombo] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [comboPopup, setComboPopup] = useState(null); // { text, key }
  const [xpPopup, setXpPopup] = useState(null);

  const { data: existingSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => base44.entities.StudySession.filter({ status: 'active' }),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles } = useQuery({
    queryKey: ['profile'],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });
  const profile = profiles?.[0];

  const existingSession = existingSessions.length > 0 ? existingSessions[0] : null;

  const loadHistory = useCallback(async (sessionId) => {
    return base44.entities.QuestionHistory.filter({ session_id: sessionId }, '-created_date', 100);
  }, []);

  // Prefetch next question in background
  const prefetchNext = useCallback((sess, mastery, topics, params) => {
    const difficulty = calculateDifficulty(mastery || 0);
    const weakTopics = Object.entries(topics || {}).filter(([_, s]) => s < 80).sort(([, a], [, b]) => a - b);
    const targetTopic = weakTopics.length > 0 ? weakTopics[0][0] : (params?.subtopics?.[0] || null);
    generateQuestion({
      grade: sess.grade_level, subject: sess.subject, curriculum: sess.curriculum,
      topic: targetTopic, subTopic: null, difficulty, isRemedial: false,
      elaFocus: params?.elaFocus,
    }).then(q => setPrefetchedQuestion(q)).catch(() => {});
  }, []);

  const updateStreak = async (userEmail) => {
    const profs = await base44.entities.UserProfile.filter({ user_email: userEmail });
    const today = new Date().toISOString().slice(0, 10);
    if (profs.length === 0) {
      await base44.entities.UserProfile.create({
        user_email: userEmail, streak_days: 1, last_active_date: today,
        total_sessions: 1, medals: [], total_questions_answered: 0, total_correct: 0,
      });
    } else {
      const p = profs[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = p.last_active_date === yesterday ? (p.streak_days || 0) + 1 : p.last_active_date === today ? p.streak_days : 1;
      await base44.entities.UserProfile.update(p.id, {
        streak_days: newStreak, last_active_date: today, total_sessions: (p.total_sessions || 0) + 1,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const handleStart = async ({ grade, curriculum, subject, subtopics, elaFocus }) => {
    setSetupLoading(true);
    const params = { subtopics, elaFocus };
    setSessionParams(params);
    let activeSession;

    if (existingSession && existingSession.grade_level === grade && existingSession.subject === subject) {
      activeSession = existingSession;
      const history = await loadHistory(activeSession.id);
      const mastery = calculateMasteryScore(history);
      const topics = calculateTopicScores(history);
      setTopicScores(topics);
      setQuestionNumber(history.length);
      if (activeSession.first_question_data && history.length === 0) {
        setCurrentQuestion(activeSession.first_question_data);
        prefetchNext(activeSession, mastery, topics, params);
      } else {
        await generateNextQuestion(activeSession, mastery, topics, params);
      }
    } else {
      if (existingSession) {
        await base44.entities.StudySession.update(existingSession.id, { status: 'completed' });
      }
      activeSession = await base44.entities.StudySession.create({
        grade_level: grade, curriculum, subject,
        total_questions: 0, correct_answers: 0, mastery_score: 0,
        difficulty_level: 'beginner', topic_scores: {}, status: 'active',
      });

      const targetTopic = subtopics?.[0] || null;
      const firstQ = await generateQuestion({
        grade, subject, curriculum, topic: targetTopic, subTopic: null,
        difficulty: 'beginner', isRemedial: false, elaFocus,
      });
      await base44.entities.StudySession.update(activeSession.id, { first_question: firstQ.question, first_question_data: firstQ });
      activeSession.first_question_data = firstQ;
      setCurrentQuestion(firstQ);
      // Start prefetching second question immediately
      prefetchNext(activeSession, 0, {}, params);
    }

    if (user?.email) await updateStreak(user.email);
    setSession(activeSession);
    setView('quiz');
    setSetupLoading(false);
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
  };

  const generateNextQuestion = async (sess, mastery, topics, params) => {
    // Use prefetched question if available
    if (prefetchedQuestion) {
      setCurrentQuestion(prefetchedQuestion);
      setPrefetchedQuestion(null);
      setIsRemedial(false);
      // Immediately start prefetching the one after
      prefetchNext(sess, mastery, topics, params || sessionParams);
      return;
    }
    setIsGenerating(true);
    const difficulty = calculateDifficulty(mastery || 0);
    const weakTopics = Object.entries(topics || {}).filter(([_, s]) => s < 80).sort(([, a], [, b]) => a - b);
    const p = params || sessionParams;
    const targetTopic = weakTopics.length > 0 ? weakTopics[0][0] : (p?.subtopics?.[0] || null);

    const q = await generateQuestion({
      grade: sess.grade_level, subject: sess.subject, curriculum: sess.curriculum,
      topic: targetTopic, subTopic: null, difficulty, isRemedial: false,
      elaFocus: p?.elaFocus,
    });
    setCurrentQuestion(q);
    setIsRemedial(false);
    setIsGenerating(false);
    prefetchNext(sess, mastery, topics, p);
  };

  const showComboPopup = (newCombo, xpGained) => {
    if (newCombo >= 3) {
      const msgs = { 3: '🔥 3x Combo!', 5: '⚡ 5x Blazing!', 10: '💥 10x Unstoppable!' };
      const msg = msgs[newCombo] || (newCombo >= 7 ? '🚀 On Fire!' : null);
      if (msg) {
        setComboPopup({ text: msg, key: Date.now() });
        setTimeout(() => setComboPopup(null), 1800);
      }
    }
    if (xpGained) {
      setXpPopup({ text: `+${xpGained} XP`, key: Date.now() });
      setTimeout(() => setXpPopup(null), 1200);
    }
  };

  const handleAnswer = async (userAnswer, isCorrect) => {
    if (!session || !currentQuestion) return;

    const newQuestionNumber = questionNumber + 1;
    setQuestionNumber(newQuestionNumber);

    // Gamification: combo + XP
    const newCombo = isCorrect ? combo + 1 : 0;
    setCombo(newCombo);
    const diffMultiplier = { beginner: 10, intermediate: 15, advanced: 22, mastery: 35 }[session.difficulty_level || 'beginner'] || 10;
    const comboBonus = Math.min(newCombo - 1, 5) * 3;
    const xpGained = isCorrect ? diffMultiplier + comboBonus : 0;
    setSessionXP(prev => prev + xpGained);
    showComboPopup(newCombo, xpGained);

    // Save history in background (don't await)
    base44.entities.QuestionHistory.create({
      session_id: session.id,
      question_text: currentQuestion.question,
      options: currentQuestion.options || [],
      correct_answer: currentQuestion.correctAnswer,
      user_answer: userAnswer,
      is_correct: isCorrect,
      topic: currentQuestion.topic || '',
      sub_topic: currentQuestion.subTopic || '',
      difficulty: session.difficulty_level || 'beginner',
      is_remedial: isRemedial,
      question_index: newQuestionNumber,
    });

    const newTotal = (session.total_questions || 0) + 1;
    const newCorrect = (session.correct_answers || 0) + (isCorrect ? 1 : 0);

    const history = await loadHistory(session.id);
    const mastery = calculateMasteryScore(history);
    const topics = calculateTopicScores(history);
    const difficulty = calculateDifficulty(mastery);

    setTopicScores(topics);

    const updatedSession = {
      ...session,
      total_questions: newTotal, correct_answers: newCorrect,
      mastery_score: mastery, difficulty_level: difficulty, topic_scores: topics,
    };
    setSession(updatedSession);

    // Save session update in background
    base44.entities.StudySession.update(session.id, {
      total_questions: newTotal, correct_answers: newCorrect,
      mastery_score: mastery, difficulty_level: difficulty, topic_scores: topics,
    });

    // Update profile SmartScore + per-topic SmartScore
    if (user?.email) {
      const profs = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profs.length > 0) {
        const p = profs[0];
        const currentScore = p.smart_score || 0;
        const scoreDelta = isCorrect ? Math.round(diffMultiplier * 0.6) : -Math.round(diffMultiplier * 0.3);
        const newScore = Math.max(0, Math.min(100, currentScore + scoreDelta));
        setSmartScoreDelta(scoreDelta);

        // Update per-topic SmartScore
        const topicKey = currentQuestion.topic ? `${session.subject}:${currentQuestion.topic}` : null;
        const topicUpdates = topicKey ? (() => {
          const existing = p.topic_smart_scores || {};
          const current = existing[topicKey] || 0;
          const delta = isCorrect ? Math.round(diffMultiplier * 0.5) : -Math.round(diffMultiplier * 0.25);
          return { ...existing, [topicKey]: Math.max(0, Math.min(100, current + delta)) };
        })() : (p.topic_smart_scores || {});

        base44.entities.UserProfile.update(p.id, {
          total_questions_answered: (p.total_questions_answered || 0) + 1,
          total_correct: (p.total_correct || 0) + (isCorrect ? 1 : 0),
          smart_score: newScore,
          topic_smart_scores: topicUpdates,
        });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    }

    // Check mastery completion
    if (!isRemedial && newTotal >= 8 && mastery >= 75) {
      checkMasteryCompletion(updatedSession, history).then(completion => {
        if (completion?.hasPassedStandard) {
          const medal = {
            standardName: completion.standardName, message: completion.message,
            subject: session.subject, grade: session.grade_level,
            topic: currentQuestion.topic, earned_date: new Date().toISOString(), mastery_score: mastery,
          };
          setEarnedMedal(medal);
          if (user?.email) {
            base44.entities.UserProfile.filter({ user_email: user.email }).then(profs => {
              if (profs.length > 0) {
                base44.entities.UserProfile.update(profs[0].id, { medals: [...(profs[0].medals || []), medal] });
              }
            });
          }
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      });
    }

    // Adaptive loop
    if (!isCorrect && !isRemedial) {
      setView('searching');
      const remedialPassage = session.subject === 'English Language Arts' ? currentQuestion.passage : null;
      // Generate 2 remedials (faster than 3)
      const remedials = await Promise.all([0, 1].map(() =>
        generateQuestion({
          grade: session.grade_level, subject: session.subject, curriculum: session.curriculum,
          topic: currentQuestion.topic, subTopic: currentQuestion.subTopic,
          difficulty: 'beginner', isRemedial: true, passage: remedialPassage,
        })
      ));
      setQuestionQueue(remedials);
      setRemedialTotal(2);
      setRemedialIndex(1);
      setIsRemedial(true);
      setCurrentQuestion(remedials[0]);
      setView('quiz');
    } else if (isRemedial && questionQueue.length > 1) {
      const remaining = questionQueue.slice(1);
      setQuestionQueue(remaining);
      setRemedialIndex(remedialTotal - remaining.length + 1);
      setCurrentQuestion(remaining[0]);
    } else {
      setIsRemedial(false);
      setRemedialIndex(0);
      setQuestionQueue([]);
      await generateNextQuestion(updatedSession, mastery, topics);
    }
  };

  const handleReset = async () => {
    if (session) base44.entities.StudySession.update(session.id, { status: 'completed' });
    setSession(null);
    setCurrentQuestion(null);
    setPrefetchedQuestion(null);
    setQuestionQueue([]);
    setQuestionNumber(0);
    setTopicScores({});
    setCombo(0);
    setSessionXP(0);
    setView('setup');
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
  };

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundOrbs />
      <NavBar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-10">
        <AnimatePresence mode="wait">
          {view === 'setup' && (
            <motion.div key="setup" exit={{ opacity: 0, y: -20 }} className="max-w-xl mx-auto space-y-5">
              <SetupForm onStart={handleStart} isLoading={setupLoading} existingSession={existingSession} />
              {(profile?.streak_days > 0 || profile?.smart_score > 0) && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {profile?.streak_days > 0 && (
                    <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-xl">🔥</div>
                      <div>
                        <div className="text-2xl font-extrabold text-foreground">{profile.streak_days}</div>
                        <div className="text-xs text-muted-foreground">day streak</div>
                      </div>
                    </div>
                  )}
                  {profile?.smart_score > 0 && (
                    <div className="bg-card border border-border rounded-2xl px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">SmartScore</span>
                      </div>
                      <div className="text-3xl font-extrabold text-foreground font-mono">{profile.smart_score}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{profile.total_questions_answered || 0} questions answered</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {view === 'searching' && (
            <motion.div key="searching" exit={{ opacity: 0 }}>
              <SearchingOverlay topic={currentQuestion?.topic} subTopic={currentQuestion?.subTopic} />
            </motion.div>
          )}

          {view === 'quiz' && session && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Top bar */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={handleReset} className="text-muted-foreground hover:text-foreground rounded-xl text-sm h-8">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  End Session
                </Button>

                {/* Gamification bar */}
                <div className="flex items-center gap-3">
                  {/* Session XP */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {sessionXP} XP
                  </div>
                  {/* Combo */}
                  {combo >= 2 && (
                    <motion.div
                      key={combo}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold"
                    >
                      <Flame className="w-3 h-3" />
                      {combo}x combo
                    </motion.div>
                  )}
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {session.grade_level} · {session.subject}
                  </span>
                </div>
              </div>

              {/* Combo popup */}
              <AnimatePresence>
                {comboPopup && (
                  <motion.div
                    key={comboPopup.key}
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.7 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-card border border-primary/30 text-base font-bold text-foreground shadow-xl shadow-primary/20 pointer-events-none"
                  >
                    {comboPopup.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* XP popup */}
              <AnimatePresence>
                {xpPopup && (
                  <motion.div
                    key={xpPopup.key}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -24 }}
                    exit={{ opacity: 0 }}
                    className="fixed top-32 right-8 z-50 text-amber-400 font-bold text-sm pointer-events-none"
                  >
                    {xpPopup.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mastery bar */}
              <MasteryBar
                score={session.mastery_score || 0}
                difficulty={session.difficulty_level || 'beginner'}
                totalQuestions={session.total_questions || 0}
                correctAnswers={session.correct_answers || 0}
              />

              <div className="mt-5">
                {isGenerating ? (
                  <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Generating question...</p>
                  </div>
                ) : currentQuestion ? (
                  <div className={`grid gap-5 ${currentQuestion?.passage ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
                    {currentQuestion?.passage ? (
                      <>
                        <div className="col-span-1">
                          <QuizCard
                            key={`${questionNumber}-${currentQuestion.question?.slice(0, 20)}`}
                            question={currentQuestion}
                            onAnswer={handleAnswer}
                            isRemedial={isRemedial}
                            remedialIndex={remedialIndex}
                            remedialTotal={remedialTotal}
                            questionNumber={questionNumber + 1}
                          />
                        </div>
                        <div className="col-span-1">
                          <SessionSidebar
                            profile={profile}
                            session={session}
                            questionCount={questionNumber}
                            smartScoreDelta={smartScoreDelta}
                            topicScores={topicScores}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="lg:col-span-2">
                          <QuizCard
                            key={`${questionNumber}-${currentQuestion.question?.slice(0, 20)}`}
                            question={currentQuestion}
                            onAnswer={handleAnswer}
                            isRemedial={isRemedial}
                            remedialIndex={remedialIndex}
                            remedialTotal={remedialTotal}
                            questionNumber={questionNumber + 1}
                          />
                        </div>
                        <div>
                          <SessionSidebar
                            profile={profile}
                            session={session}
                            questionCount={questionNumber}
                            smartScoreDelta={smartScoreDelta}
                            topicScores={topicScores}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MedalModal medal={earnedMedal} onClose={() => setEarnedMedal(null)} />
    </div>
  );
}