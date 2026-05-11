// QuizCard component
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gradeOpenAnswer } from '@/lib/aiClient';

// MathJax text renderer
export function MathText({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    ref.current.innerHTML = text;
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([ref.current]).catch(() => {});
    }
  }, [text]);
  return <span ref={ref} />;
}

// Inline PassagePanel — full passage visible, scrollable
function PassagePanel({ passage }) {
  const [page, setPage] = useState(0);
  if (!passage) return null;

  const pages = splitIntoPages(passage.text, 700);
  const totalPages = pages.length;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border shrink-0 bg-secondary/20">
        <BookOpen className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{passage.title}</h2>
          {passage.author && <p className="text-xs text-muted-foreground">by {passage.author}</p>}
        </div>
        {passage.genre && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">{passage.genre}</span>
        )}
        {totalPages > 1 && (
          <span className="text-xs text-muted-foreground shrink-0">{page + 1}/{totalPages}</span>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto px-6 py-5"
          >
            <p className="text-sm text-foreground leading-[1.9] whitespace-pre-wrap font-serif tracking-wide">
              {pages[page]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0 bg-secondary/10">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="flex gap-1">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-1.5 rounded-full transition-all ${i === page ? 'bg-primary w-4' : 'bg-border w-1.5 hover:bg-muted-foreground'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function splitIntoPages(text, charsPerPage) {
  if (!text) return [''];
  if (text.length <= charsPerPage) return [text];
  const pages = [];
  let remaining = text;
  while (remaining.length > charsPerPage) {
    let breakAt = remaining.lastIndexOf('. ', charsPerPage);
    if (breakAt < charsPerPage * 0.5) breakAt = remaining.lastIndexOf(' ', charsPerPage);
    if (breakAt < 0) breakAt = charsPerPage;
    else breakAt += 1;
    pages.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining.length > 0) pages.push(remaining);
  return pages;
}

// Math diagram inline
function MathDiagram({ diagram }) {
  if (!diagram) return null;
  return (
    <div className="bg-secondary/30 border border-border rounded-xl p-4 mb-4">
      <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Problem Setup</div>
      {diagram.description && (
        <p className="text-sm text-foreground leading-relaxed mb-2"><MathText text={diagram.description} /></p>
      )}
      {diagram.values?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {diagram.values.map((v, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
              <MathText text={v} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionPanel({ question, isRemedial, remedialIndex, remedialTotal, questionNumber, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [openInput, setOpenInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const isOpen = question?.type === 'open';

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt);
    setIsCorrect(opt === question.correctAnswer);
    setRevealed(true);
  };

  const handleOpenSubmit = async () => {
    if (!openInput.trim() || revealed) return;
    setIsGrading(true);
    const correct = await gradeOpenAnswer(question.question, question.correctAnswer, openInput);
    setIsCorrect(correct);
    setRevealed(true);
    setIsGrading(false);
  };

  const handleNext = () => {
    onAnswer(isOpen ? openInput : selected, isCorrect);
    setSelected(null);
    setOpenInput('');
    setRevealed(false);
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRemedial ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 font-semibold">
              Practice {remedialIndex}/{remedialTotal}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">
              Q{questionNumber}
            </span>
          )}
        </div>
        {question?.topic && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="w-3 h-3" />
            <span className="truncate max-w-[160px]">{question.topic}</span>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {question?.diagram && <MathDiagram diagram={question.diagram} />}

        <div className="text-base font-medium text-foreground leading-relaxed">
          <MathText text={question?.question} />
        </div>

        {isOpen ? (
          <div className="space-y-3">
            <textarea
              value={openInput}
              onChange={(e) => setOpenInput(e.target.value)}
              disabled={revealed}
              placeholder="Write your answer here..."
              rows={3}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-none"
            />
            {!revealed && (
              <Button
                onClick={handleOpenSubmit}
                disabled={!openInput.trim() || isGrading}
                className="w-full rounded-xl h-10 text-sm font-medium"
              >
                {isGrading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Submit Answer'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {question?.options?.map((opt, i) => {
              const isSelected = selected === opt;
              const isRight = opt === question.correctAnswer;
              let cls = 'bg-secondary/40 border-border text-foreground hover:border-primary/30 hover:bg-secondary/60';
              if (revealed) {
                if (isRight) cls = 'bg-green-500/15 border-green-500/40 text-green-300';
                else if (isSelected) cls = 'bg-red-500/15 border-red-500/40 text-red-300';
                else cls = 'bg-secondary/20 border-border/50 text-muted-foreground opacity-60';
              } else if (isSelected) {
                cls = 'bg-primary/15 border-primary/50 text-primary';
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  disabled={revealed}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 ${cls} disabled:cursor-default`}
                >
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${revealed && isRight ? 'border-green-400 text-green-400' : revealed && isSelected ? 'border-red-400 text-red-400' : 'border-current'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1"><MathText text={opt} /></span>
                  {revealed && isRight && <CheckCircle className="w-4 h-4 shrink-0 text-green-400" />}
                  {revealed && isSelected && !isRight && <XCircle className="w-4 h-4 shrink-0 text-red-400" />}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {revealed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${isCorrect ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {isCorrect ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <span className="font-semibold">{isCorrect ? 'Correct!' : 'Not quite.'}</span>
                  {!isCorrect && question?.correctAnswer && (
                    <p className="text-xs mt-1 text-foreground/60">Answer: <span className="font-medium text-foreground/80"><MathText text={question.correctAnswer} /></span></p>
                  )}
                  {question?.explanation && (
                    <p className="text-xs mt-1.5 text-foreground/60 leading-relaxed"><MathText text={question.explanation} /></p>
                  )}
                </div>
              </div>
              <Button onClick={handleNext} className="w-full rounded-xl h-10 text-sm font-semibold gap-2">
                Next Question <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function QuizCard(props) {
  const { question } = props;
  const hasPassage = !!question?.passage;

  if (hasPassage) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: '560px' }}>
        <div style={{ minHeight: '520px' }}>
          <PassagePanel passage={question.passage} />
        </div>
        <div style={{ minHeight: '520px' }}>
          <QuestionPanel {...props} />
        </div>
      </div>
    );
  }

  return <QuestionPanel {...props} />;
}