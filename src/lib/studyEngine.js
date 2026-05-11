// Study Engine - manages adaptive learning logic

const MASTERY_THRESHOLD = 80;
const DIFFICULTY_THRESHOLDS = {
  beginner: 0,
  intermediate: 40,
  advanced: 65,
  mastery: 85
};

export function calculateDifficulty(masteryScore) {
  if (masteryScore >= DIFFICULTY_THRESHOLDS.mastery) return "mastery";
  if (masteryScore >= DIFFICULTY_THRESHOLDS.advanced) return "advanced";
  if (masteryScore >= DIFFICULTY_THRESHOLDS.intermediate) return "intermediate";
  return "beginner";
}

export function calculateMasteryScore(history) {
  if (!history || history.length === 0) return 0;

  // Weighted: recent answers count more, difficulty multiplier applied
  const n = history.length;
  const weights = history.map((_, i) => 0.5 + (i / n) * 1.5); // 0.5 → 2.0
  const diffMult = { beginner: 0.7, intermediate: 0.9, advanced: 1.1, mastery: 1.3 };

  let weightedCorrect = 0;
  let weightedTotal = 0;
  history.forEach((item, i) => {
    const mult = diffMult[item.difficulty] || 0.9;
    weightedTotal += weights[i] * mult;
    if (item.is_correct) weightedCorrect += weights[i] * mult;
  });

  if (weightedTotal === 0) return 0;
  return Math.min(100, Math.round((weightedCorrect / weightedTotal) * 100));
}

export function calculateTopicScores(history) {
  const topicMap = {};
  
  history.forEach(item => {
    const topic = item.topic || item.sub_topic || 'General';
    if (!topicMap[topic]) {
      topicMap[topic] = { correct: 0, total: 0 };
    }
    topicMap[topic].total++;
    if (item.is_correct) topicMap[topic].correct++;
  });

  const scores = {};
  Object.entries(topicMap).forEach(([topic, data]) => {
    scores[topic] = Math.round((data.correct / data.total) * 100);
  });
  
  return scores;
}

export function getWeakTopics(topicScores) {
  return Object.entries(topicScores)
    .filter(([_, score]) => score < MASTERY_THRESHOLD)
    .sort(([, a], [, b]) => a - b)
    .map(([topic]) => topic);
}

export function shouldGenerateRemedial(lastAnswer) {
  return lastAnswer && !lastAnswer.is_correct;
}

export function getNextTopicSuggestion(topicScores, currentTopic) {
  const weak = getWeakTopics(topicScores);
  if (weak.length > 0 && weak[0] !== currentTopic) {
    return weak[0];
  }
  return null;
}