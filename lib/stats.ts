import { mean, variance } from 'simple-statistics';
import { Survey, Response, Statistics } from './types';

export function calculateStatistics(survey: Survey, responses: Response[]): Statistics {
  const stats: Statistics = {};

  for (const question of survey.questions) {
    const qId = question.id;
    const qText = question.text;
    const qType = question.type;

    const values = responses.map((r) => r.data[qId]).filter((v) => v !== undefined);

    if (qType === 'rating' || qType === 'nps') {
      const numValues = values.map(Number);
      const mu = mean(numValues);
      const v = variance(numValues);
      const std = Math.sqrt(v);

      stats[qId] = {
        type: qType,
        text: qText,
        mean: parseFloat(mu.toFixed(2)),
        std: parseFloat(std.toFixed(2)),
        min: Math.min(...numValues),
        max: Math.max(...numValues)
      };
    } else if (qType === 'single' || qType === 'multiple') {
      const frequency: Record<string, number> = {};
      for (const v of values) {
        frequency[String(v)] = (frequency[String(v)] || 0) + 1;
      }

      stats[qId] = {
        type: qType,
        text: qText,
        frequency,
        total: values.length
      };
    } else if (qType === 'text') {
      stats[qId] = {
        type: qType,
        text: qText,
        responses: values.map(String)
      };
    }
  }

  return stats;
}

export function formatStats(stats: Statistics): string {
  let text = '';

  for (const [qId, stat] of Object.entries(stats)) {
    text += `\n- ${stat.text}: `;

    if (stat.type === 'rating' || stat.type === 'nps') {
      text += `평균 ${stat.mean}/10`;
    } else if (stat.type === 'single' || stat.type === 'multiple') {
      const topChoice = Object.entries(stat.frequency).sort(([, a], [, b]) => b - a)[0];
      if (topChoice) {
        text += `최다 응답 '${topChoice[0]}' (${topChoice[1]}명)`;
      }
    }
  }

  return text;
}
