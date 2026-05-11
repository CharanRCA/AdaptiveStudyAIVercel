// AI Client — uses base44 InvokeLLM for fast, reliable generation
import { base44 } from '@/api/base44Client';

// In-memory cache to avoid repeating recently asked questions
const recentQuestions = [];
const MAX_RECENT = 20;

function trackQuestion(q) {
  if (!q?.question) return;
  recentQuestions.push(q.question.slice(0, 80));
  if (recentQuestions.length > MAX_RECENT) recentQuestions.shift();
}

function getAvoidList() {
  return recentQuestions.length > 0
    ? `\nIMPORTANT: Do NOT generate questions similar to these recent ones:\n${recentQuestions.slice(-8).map((q, i) => `${i + 1}. "${q}"`).join('\n')}`
    : '';
}

// Generate an ELA passage
export async function generatePassage({ grade, topic, subTopic, difficulty }) {
  const genres = ['short story', 'informational essay', 'narrative excerpt', 'persuasive essay'];
  const genre = genres[Math.floor(Math.random() * genres.length)];
  const wordTarget = { beginner: 150, intermediate: 220, advanced: 320, mastery: 420 }[difficulty] || 180;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write an original ${genre} for a Grade ${grade} student. Topic: "${topic || subTopic || 'any age-appropriate topic'}". Length: ~${wordTarget} words. Age-appropriate and engaging. NO questions in the passage.
Respond with ONLY valid JSON: { "title": string, "author": string, "text": string, "genre": string }`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          text: { type: 'string' },
          genre: { type: 'string' },
        },
      },
    });
    if (result?.text && result.text.length > 50) return result;
  } catch (e) {
    console.warn('Passage generation failed:', e.message);
  }
  return null;
}

export async function generateQuestion(params) {
  const { grade, subject, curriculum, topic, subTopic, difficulty, isRemedial, passage, elaFocus } = params;

  const difficultyDesc = {
    beginner: 'basic recall and simple application',
    intermediate: 'application and analysis',
    advanced: 'analysis and evaluation',
    mastery: 'synthesis and creation',
  };

  // Always multiple choice for speed — open-ended only 20% of the time
  const useOpenEnded = Math.random() < 0.2;
  const typeInstructions = useOpenEnded
    ? `Question type: FREE RESPONSE. Set "type" to "open", "options" as [], "correctAnswer" as a concise string.`
    : `Question type: MULTIPLE CHOICE. Set "type" to "mc", exactly 4 choices in "options", "correctAnswer" must exactly match one option.`;

  const mathNote = subject === 'Mathematics'
    ? 'Use LaTeX for math ($x^2$, $\\frac{3}{4}$, $\\sqrt{16}$).'
    : '';

  const elaPassageNote = subject === 'English Language Arts' && passage
    ? `Base this question on this passage:\n---\n${passage.text.slice(0, 1200)}\n---\nFocus on: main idea, inference, vocabulary, literary devices, author's purpose, or text structure.`
    : '';

  const elaFocusNote = subject === 'English Language Arts' && elaFocus && elaFocus !== 'adaptive'
    ? `Focus area: ${elaFocus}. Generate a question specifically about ${elaFocus}.`
    : '';

  const avoidList = getAvoidList();
  const topicLine = topic ? `Topic: ${topic}. Sub-topic: ${subTopic || 'any'}.` : `Choose a varied topic appropriate for Grade ${grade} ${subject}.`;

  const prompt = isRemedial
    ? `Expert ${subject} teacher. Remedial question for Grade ${grade} (${curriculum}). Student missed: "${subTopic || topic}". Simpler, scaffolded.
Difficulty: ${difficulty}. ${typeInstructions} ${mathNote} ${elaPassageNote}
Keep question short and clear. Explanation must teach the concept.${avoidList}
JSON: { "question": string, "options": array, "correctAnswer": string, "explanation": string, "topic": string, "subTopic": string, "type": "mc"|"open", "needsPassage": boolean }`
    : `Expert ${subject} teacher. HIGH-QUALITY question for Grade ${grade}, ${curriculum}.
${topicLine} Difficulty: ${difficulty} (${difficultyDesc[difficulty]}). ${typeInstructions} ${mathNote} ${elaPassageNote} ${elaFocusNote}
- Clear, unambiguous question
- Plausible but clearly wrong distractors for MC
- Explanation: thorough 2-3 sentence teaching explanation that shows WHY the answer is correct and helps the student understand the underlying concept, not just confirm the answer
- Vary styles: problems, definitions, analysis, application${subject === 'English Language Arts' ? '\nneedsPassage=true only if question requires reading a passage.' : ''}${avoidList}
JSON: { "question": string, "options": array, "correctAnswer": string, "explanation": string, "topic": string, "subTopic": string, "type": "mc"|"open", "needsPassage": boolean }`;

  const schema = {
    type: 'object',
    properties: {
      question: { type: 'string' },
      options: { type: 'array', items: { type: 'string' } },
      correctAnswer: { type: 'string' },
      explanation: { type: 'string' },
      topic: { type: 'string' },
      subTopic: { type: 'string' },
      type: { type: 'string' },
      needsPassage: { type: 'boolean' },
    },
  };

  try {
    const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    if (result && result.question) {
      trackQuestion(result);
      const q = { ...result, source: 'ai', passage: passage || null, diagram: null };

      if (subject === 'English Language Arts' && result.needsPassage && !passage) {
        q.passage = await generatePassage({ grade, topic: result.topic || topic, subTopic: result.subTopic || subTopic, difficulty });
      }
      return q;
    }
  } catch (e) {
    console.warn('AI generation failed, using local fallback:', e.message);
  }

  return generateLocalQuestion(params);
}

// AI-powered answer grading for open-ended questions
export async function gradeOpenAnswer(question, correctAnswer, userAnswer) {
  if (!userAnswer || userAnswer.trim() === '') return false;

  const ua = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
  const ca = (correctAnswer || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const uaNum = parseFloat(ua.replace(/[^0-9.\-]/g, ''));
  const caNum = parseFloat(ca.replace(/[^0-9.\-]/g, ''));
  if (!isNaN(uaNum) && !isNaN(caNum) && Math.abs(uaNum - caNum) < 0.01) return true;
  if (ua === ca) return true;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Grade this student answer. Question: ${question}\nCorrect: ${correctAnswer}\nStudent: ${userAnswer}\nIs student correct or equivalent? Accept different valid forms ("x=5" vs "5", "1/2" vs "0.5").
JSON: { "isCorrect": boolean }`,
      response_json_schema: { type: 'object', properties: { isCorrect: { type: 'boolean' } } },
    });
    return result?.isCorrect === true;
  } catch {
    return ua.includes(ca) || ca.includes(ua);
  }
}

export async function checkMasteryCompletion(session, history) {
  if (!history || history.length < 8) return null;

  const recentHistory = history.slice(-10);
  const recentCorrect = recentHistory.filter(h => h.is_correct).length;
  if (recentCorrect < 7) return null;

  const prompt = `Student completed ${history.length} questions on ${session.subject} (${session.grade_level}, ${session.curriculum}). Mastery: ${session.mastery_score}%. Recent: ${recentCorrect}/10 correct. Difficulty: ${session.difficulty_level}. Topics: ${Object.keys(session.topic_scores || {}).join(', ')}.
Has the student demonstrated mastery of the relevant standard?
JSON: { "hasPassedStandard": boolean, "standardName": string, "confidence": number, "message": string }`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          hasPassedStandard: { type: 'boolean' },
          standardName: { type: 'string' },
          confidence: { type: 'number' },
          message: { type: 'string' },
        },
      },
    });
    if (result?.hasPassedStandard && result.confidence >= 75) return result;
  } catch (e) {
    console.warn('Mastery check failed:', e.message);
  }
  return null;
}

export async function searchStandards(grade, subject, topic) {
  return { standards: [], relatedTopics: [topic] };
}

function generateLocalQuestion({ subject, difficulty }) {
  const banks = {
    Mathematics: {
      beginner: [
        { question: 'A rectangle has length 8 and width 5. What is its area?', options: ['40', '26', '13', '35'], correctAnswer: '40', explanation: 'Area = length × width = 8 × 5 = 40.', topic: 'Geometry', subTopic: 'Area', type: 'mc' },
        { question: 'What is $\\frac{3}{4} + \\frac{1}{2}$?', options: ['$\\frac{5}{4}$', '$\\frac{4}{6}$', '$\\frac{1}{2}$', '$\\frac{3}{8}$'], correctAnswer: '$\\frac{5}{4}$', explanation: 'Convert to common denominator: $\\frac{3}{4} + \\frac{2}{4} = \\frac{5}{4}$.', topic: 'Fractions', subTopic: 'Adding Fractions', type: 'mc' },
        { question: 'What is 7 × 8?', options: ['54', '56', '48', '64'], correctAnswer: '56', explanation: '7 × 8 = 56.', topic: 'Arithmetic', subTopic: 'Multiplication', type: 'mc' },
      ],
      intermediate: [
        { question: 'Solve for $x$: $3x + 7 = 22$', options: ['x = 3', 'x = 5', 'x = 7', 'x = 4'], correctAnswer: 'x = 5', explanation: '$3x = 15 \\Rightarrow x = 5$.', topic: 'Algebra', subTopic: 'Linear Equations', type: 'mc' },
        { question: 'What is the slope of the line through $(2,3)$ and $(6,11)$?', options: ['2', '4', '½', '8'], correctAnswer: '2', explanation: 'Slope $= \\frac{11-3}{6-2} = 2$.', topic: 'Algebra', subTopic: 'Slope', type: 'mc' },
      ],
      advanced: [
        { question: 'What is the solution set of $x^2 - 5x + 6 = 0$?', options: ['{2, 3}', '{1, 6}', '{−2, −3}', '{−1, −6}'], correctAnswer: '{2, 3}', explanation: 'Factor: $(x−2)(x−3) = 0$.', topic: 'Algebra', subTopic: 'Quadratics', type: 'mc' },
      ],
      mastery: [
        { question: "If $f(x) = 2x^2 + 3x − 5$, what is $f'(x)$?", options: ['$4x + 3$', '$4x − 3$', '$2x + 3$', '$x^2 + 3$'], correctAnswer: '$4x + 3$', explanation: "Power rule: $f'(x) = 4x + 3$.", topic: 'Calculus', subTopic: 'Derivatives', type: 'mc' },
      ],
    },
    Science: {
      beginner: [
        { question: 'What is the chemical formula for water?', options: ['H₂O', 'CO₂', 'NaCl', 'O₂'], correctAnswer: 'H₂O', explanation: '2 hydrogen + 1 oxygen = H₂O.', topic: 'Chemistry', subTopic: 'Formulas', type: 'mc' },
      ],
      intermediate: [
        { question: "What does Newton's Second Law state?", options: ['F = ma', 'F = mv', 'E = mc²', 'V = IR'], correctAnswer: 'F = ma', explanation: 'Force = mass × acceleration.', topic: 'Physics', subTopic: 'Motion', type: 'mc' },
      ],
      advanced: [
        { question: 'Where does the Krebs cycle occur?', options: ['Mitochondrial matrix', 'Cytoplasm', 'Cell membrane', 'Nucleus'], correctAnswer: 'Mitochondrial matrix', explanation: 'Krebs cycle: mitochondrial matrix.', topic: 'Biology', subTopic: 'Cellular Respiration', type: 'mc' },
      ],
      mastery: [
        { question: 'What happens to entropy in an isolated system?', options: ['Always increases', 'Always decreases', 'Stays constant', 'Depends on temp'], correctAnswer: 'Always increases', explanation: '2nd Law of Thermodynamics.', topic: 'Physics', subTopic: 'Thermodynamics', type: 'mc' },
      ],
    },
    'English Language Arts': {
      beginner: [
        { question: 'Which sentence uses a simile?', options: ['Her smile was like sunshine.', 'The wind howled all night.', 'Time is money.', 'The stars danced.'], correctAnswer: 'Her smile was like sunshine.', explanation: "Similes use 'like' or 'as' to compare.", topic: 'Literary Devices', subTopic: 'Simile', type: 'mc' },
      ],
      intermediate: [
        { question: 'What is the main purpose of a thesis statement?', options: ['State the central argument', 'Provide background', 'Conclude the essay', 'List evidence'], correctAnswer: 'State the central argument', explanation: 'A thesis states the main claim of an essay.', topic: 'Writing', subTopic: 'Essay Structure', type: 'mc' },
      ],
      advanced: [
        { question: "In 'To Kill a Mockingbird,' what does the mockingbird symbolize?", options: ['Innocence', 'Freedom', 'Death', 'Justice'], correctAnswer: 'Innocence', explanation: 'The mockingbird symbolizes innocence and harmlessness.', topic: 'Literature', subTopic: 'Symbolism', type: 'mc' },
      ],
      mastery: [
        { question: "Which device is used in: 'Ask not what your country can do for you—ask what you can do for your country'?", options: ['Chiasmus', 'Anaphora', 'Alliteration', 'Hyperbole'], correctAnswer: 'Chiasmus', explanation: 'Chiasmus reverses grammatical structures.', topic: 'Rhetoric', subTopic: 'Devices', type: 'mc' },
      ],
    },
    'Social Studies': {
      beginner: [
        { question: 'What is the capital of the United States?', options: ['New York', 'Washington D.C.', 'Los Angeles', 'Chicago'], correctAnswer: 'Washington D.C.', explanation: 'Washington D.C. is the capital of the USA.', topic: 'Civics', subTopic: 'Government', type: 'mc' },
      ],
      intermediate: [
        { question: 'Which document established the framework for the U.S. government?', options: ['The Constitution', 'The Bill of Rights', 'Declaration of Independence', 'Emancipation Proclamation'], correctAnswer: 'The Constitution', explanation: 'The Constitution established the structure of the U.S. government.', topic: 'History', subTopic: 'Founding Documents', type: 'mc' },
      ],
      advanced: [
        { question: 'What was the primary cause of World War I?', options: ['Assassination of Archduke Franz Ferdinand', 'German invasion of Poland', 'Sinking of the Lusitania', 'Treaty of Versailles'], correctAnswer: 'Assassination of Archduke Franz Ferdinand', explanation: 'The assassination triggered a chain of alliances that led to WWI.', topic: 'World History', subTopic: 'WWI', type: 'mc' },
      ],
      mastery: [
        { question: 'How did the Marshall Plan affect post-WWII Europe?', options: ['Provided economic aid for reconstruction', 'Created military alliances', 'Divided Germany permanently', 'Established the United Nations'], correctAnswer: 'Provided economic aid for reconstruction', explanation: 'The Marshall Plan provided ~$13B in economic aid to rebuild Western Europe.', topic: 'Modern History', subTopic: 'Cold War', type: 'mc' },
      ],
    },
  };

  const subjectBank = banks[subject] || banks.Mathematics;
  const diffBank = subjectBank[difficulty] || subjectBank.beginner;
  return { ...diffBank[Math.floor(Math.random() * diffBank.length)], source: 'local' };
}