import { Survey, Statistics } from './types';

export function generateMarkdownReport(
  survey: Survey,
  stats: Statistics,
  interpretation: string
): string {
  let report = `# ${survey.title} — 분석 결과\n\n`;
  report += `${survey.description}\n\n`;

  // 응답 현황
  report += `## 응답 현황\n\n`;
  report += `- **생성일**: ${new Date(survey.createdAt).toLocaleDateString('ko-KR')}\n`;
  report += `- **생성일시**: ${new Date(survey.createdAt).toLocaleString('ko-KR')}\n\n`;

  // 주요 인사이트
  report += `## 주요 인사이트\n\n`;
  report += `${interpretation}\n\n`;

  // 상세 분석
  report += `## 상세 분석\n\n`;

  for (let idx = 0; idx < survey.questions.length; idx++) {
    const question = survey.questions[idx];
    const qId = question.id;
    const qStat = stats[qId];

    report += `### ${idx + 1}. ${qStat.text}\n\n`;

    if (qStat.type === 'rating' || qStat.type === 'nps') {
      report += `| 지표 | 값 |\n`;
      report += `|------|-----|\n`;
      report += `| 평균 | ${qStat.mean} |\n`;
      report += `| 표준편차 | ${qStat.std} |\n`;
      report += `| 최소값 | ${qStat.min} |\n`;
      report += `| 최대값 | ${qStat.max} |\n`;
    } else if (qStat.type === 'single' || qStat.type === 'multiple') {
      report += `| 선택지 | 응답자 | 비율 |\n`;
      report += `|--------|--------|--------|\n`;
      const sorted = Object.entries(qStat.frequency).sort(([, a], [, b]) => b - a);
      for (const [choice, count] of sorted) {
        const percentage = ((count / qStat.total) * 100).toFixed(1);
        report += `| ${choice} | ${count}명 | ${percentage}% |\n`;
      }
    } else if (qStat.type === 'text') {
      report += `**주요 응답들:**\n\n`;
      for (const resp of qStat.responses.slice(0, 3)) {
        report += `- ${resp}\n`;
      }
    }

    report += `\n`;
  }

  report += `---\n\n`;
  report += `**보고서 생성일**: ${new Date().toLocaleString('ko-KR')}\n`;

  return report;
}
