import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ArrowLeft, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import NavBar from '@/components/NavBar';
import BackgroundOrbs from '@/components/BackgroundOrbs';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const SYSTEM_PROMPT = `You are NyxLearn's educational AI tutor. You ONLY help with academic school subjects: Mathematics, Science, English Language Arts, Social Studies, History, and STEM topics.

Rules:
1. ONLY respond to academic/educational questions. For anything else, politely decline and redirect.
2. Always give THOROUGH, CLEAR explanations. Don't just give an answer — break it down step by step.
3. Use real-world analogies and examples that make the concept click for K-12 students.
4. After explaining, check understanding with a follow-up question or a mini-example for the student to try.
5. For math problems: show EVERY step with clear reasoning. Use $...$ for LaTeX.
6. For writing/ELA: explain the WHY behind grammar rules, literary devices, and essay structure.
7. For science/history: connect concepts to bigger ideas and real-world context.
8. Be warm, encouraging, and patient — make learning feel achievable.
9. Never just hand over a complete essay or exam answer. Guide the student to build it themselves.
10. If a concept has a common misconception, proactively address it.`;

const EXAMPLE_PROMPTS = [
  'Explain the Pythagorean theorem with an example',
  'What is the difference between a metaphor and a simile?',
  "Help me understand Newton's Laws of Motion",
  'How do I write a strong thesis statement?',
  'What caused World War I?',
  'Explain photosynthesis step by step',
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
        ? 'bg-primary text-primary-foreground rounded-tr-sm'
        : 'bg-card border border-border text-foreground rounded-tl-sm'
      }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm NyxLearn's AI tutor. I'm here to help you with Math, Science, English, Social Studies, and any other school subjects. What would you like to learn today? 📚" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffTopic, setIsOffTopic] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || isLoading) return;
    setInput('');
    setIsOffTopic(false);

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation context (last 8 messages)
      const context = newMessages.slice(-8).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

Conversation so far:
${context}

Respond as the Tutor now. Keep it concise and educational.`,
        model: 'gemini_3_flash',
      });

      const reply = typeof response === 'string' ? response : response?.text || response?.content || "I'm here to help with your studies! Could you rephrase your question?";

      // Check if response is a refusal
      const isRefusal = reply.toLowerCase().includes("i can only help with") || reply.toLowerCase().includes("not able to assist with") || reply.toLowerCase().includes("educational topics only");
      setIsOffTopic(isRefusal);

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble connecting. Please try again in a moment!" }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <BackgroundOrbs />
      <NavBar />

      <div className="relative z-10 flex flex-col flex-1 max-w-3xl mx-auto w-full px-4 pt-20 pb-4">
        {/* Header */}
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">NyxLearn Tutor</h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Educational AI · Restricted to academic topics
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent font-medium">
              <Sparkles className="w-3 h-3" /> AI Tutor
            </div>
          </div>
        </div>

        {/* Off-topic warning */}
        <AnimatePresence>
          {isOffTopic && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              I'm only able to help with academic and educational topics. Try asking about a school subject!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Example prompts (show only at start) */}
        {messages.length === 1 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Try asking about:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="px-3 py-1.5 rounded-full text-xs border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about math, science, ELA, history..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} className="rounded-xl h-12 px-4 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}