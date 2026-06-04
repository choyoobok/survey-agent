'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateStatistics, formatStats } from '@/lib/stats';
import { generateMarkdownReport } from '@/lib/report';
import { Survey, Statistics, Response } from '@/lib/types';

export default function ReportPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    loadReport();
  }, [surveyId]);

  const loadReport = async () => {
    try {
      const surveyResponse = await fetch(`/api/survey/${surveyId}`);
      if (!surveyResponse.ok) {
        setError('설문을 찾을 수 없습니다');
        return;
      }
      const surveyData = await surveyResponse.json();
      setSurvey(surveyData);

      // 응답 조회
      const responsesResponse = await fetch(`/api/survey/${surveyId}/responses`);
      if (!responsesResponse.ok) {
        setError('아직 응답이 없습니다');
        setIsLoading(false);
        return;
      }
      const responsesData = await responsesResponse.json();

      // 기존 리포트 확인
      const reportResponse = await fetch(`/api/survey/${surveyId}/report`);
      if (reportResponse.ok) {
        const existingReport = await reportResponse.json();
        setStats(existingReport.stats);
        setInterpretation('');
        setMarkdown(existingReport.markdown);
        setShareLink(`${window.location.origin}/survey/${surveyId}/share`);
      } else {
        // 새로 분석
        await analyzeResponses(surveyData, responsesData);
      }
    } catch (err) {
      console.error('리포트 로드 오류:', err);
      setError('리포트 로드 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeResponses = async (survey: Survey, responses: Response[]) => {
    setIsAnalyzing(true);
    try {
      // 통계 계산
      console.log('[분석] 통계 계산 시작...');
      const newStats = calculateStatistics(survey, responses);
      console.log('[분석] 통계 계산 완료:', newStats);
      setStats(newStats);

      // LLM 해석
      console.log('[분석] 포맷팅 시작...');
      const statsText = formatStats(newStats);
      console.log('[분석] 포맷팅 완료:', statsText);

      console.log('[분석] API 호출 시작...');
      const response = await fetch('/api/survey/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: survey.title,
          responseCount: responses.length,
          statsText
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`API 오류: ${response.status} - ${errData.error}`);
      }

      console.log('[분석] API 응답 수신 완료');
      const data = await response.json();
      console.log('[분석] 해석:', data.interpretation);
      setInterpretation(data.interpretation);

      // 마크다운 생성
      console.log('[분석] 마크다운 생성 시작...');
      const md = generateMarkdownReport(survey, newStats, data.interpretation);
      console.log('[분석] 마크다운 생성 완료, 길이:', md.length);
      setMarkdown(md);

      // 저장
      console.log('[분석] DB 저장 시작...');
      const saveResponse = await fetch(`/api/survey/${surveyId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: md, stats: newStats })
      });

      if (!saveResponse.ok) {
        throw new Error('리포트 저장 실패');
      }

      console.log('[분석] DB 저장 완료');
      setShareLink(`${window.location.origin}/survey/${surveyId}/share`);
      console.log('[분석] 완료!');
    } catch (err) {
      console.error('[분석] 오류 발생:', err);
      setError('분석 중 오류가 발생했습니다');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPDF = () => {
    alert('PDF 다운로드는 마크다운 다운로드로 대체하세요');
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(markdown)}`);
    element.setAttribute('download', `report-${surveyId}.md`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!survey || !stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title} — 분석 결과</h1>
          <p className="text-gray-600 mb-6">{survey.description}</p>

          {isAnalyzing ? (
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
              분석 중...
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleDownloadPDF} variant="outline">
                📄 PDF 다운로드
              </Button>
              <Button onClick={handleDownloadMarkdown} variant="outline">
                📝 마크다운 다운로드
              </Button>
              {shareLink && (
                <>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      alert('링크가 복사되었습니다');
                    }}
                    variant="outline"
                  >
                    🔗 공유 링크 복사
                  </Button>
                  <Link href={shareLink} target="_blank">
                    <Button variant="outline">👁️ 공유 링크 보기</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* 리포트 콘텐츠 */}
        <div id="report-content" className="space-y-6">
          {/* 주요 인사이트 */}
          {interpretation && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">주요 인사이트</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{interpretation}</p>
            </Card>
          )}

          {/* 상세 분석 */}
          {survey.questions.map((question, idx) => {
            const qStat = stats[question.id];
            if (!qStat) return null;

            return (
              <Card key={question.id} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {idx + 1}. {qStat.text}
                </h3>

                {/* rating/nps 차트 */}
                {(qStat.type === 'rating' || qStat.type === 'nps') && 'mean' in qStat && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">평균</p>
                      <p className="text-3xl font-bold text-blue-600">{qStat.mean}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">표준편차</p>
                      <p className="text-3xl font-bold text-blue-600">{qStat.std.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">최소</p>
                      <p className="text-3xl font-bold text-blue-600">{qStat.min}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">최대</p>
                      <p className="text-3xl font-bold text-blue-600">{qStat.max}</p>
                    </div>
                  </div>
                )}

                {/* single/multiple 차트 */}
                {(qStat.type === 'single' || qStat.type === 'multiple') && 'frequency' in qStat && (
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">선택지</th>
                          <th className="text-center py-2">응답자</th>
                          <th className="text-right py-2">비율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(qStat.frequency)
                          .sort(([, a], [, b]) => b - a)
                          .map(([choice, count]) => (
                            <tr key={choice} className="border-b">
                              <td className="py-2">{choice}</td>
                              <td className="text-center py-2">{count}명</td>
                              <td className="text-right py-2">
                                {((count / qStat.total) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* text 응답 */}
                {qStat.type === 'text' && 'responses' in qStat && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">주요 응답들</h4>
                    <ul className="space-y-2">
                      {qStat.responses.slice(0, 3).map((resp, i) => (
                        <li key={i} className="text-gray-700 flex gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>생성일: {new Date().toLocaleString('ko-KR')}</p>
        </div>
      </div>
    </div>
  );
}
