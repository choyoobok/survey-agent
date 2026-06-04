'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { getSurvey, getReport } from '@/lib/db';
import { Survey } from '@/lib/types';

export default function SharePage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [surveyId]);

  const loadReport = async () => {
    try {
      const surveyData = await getSurvey(surveyId);
      if (!surveyData) {
        setError('설문을 찾을 수 없습니다');
        return;
      }

      const report = await getReport(surveyId);
      if (!report) {
        setError('리포트를 찾을 수 없습니다');
        return;
      }

      setSurvey(surveyData);
      setMarkdown(report.markdown);
    } catch (err) {
      setError('리포트 로드 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error || !survey || !markdown) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || '리포트를 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          {/* 마크다운을 HTML로 렌더링 */}
          <div className="prose prose-sm max-w-none">
            {markdown.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) {
                return (
                  <h1 key={idx} className="text-3xl font-bold text-gray-900 mb-4">
                    {line.substring(2)}
                  </h1>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-6 mb-4">
                    {line.substring(3)}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-xl font-semibold text-gray-900 mt-4 mb-3">
                    {line.substring(4)}
                  </h3>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={idx} className="text-gray-700 ml-4">
                    {line.substring(2)}
                  </li>
                );
              }
              if (line.startsWith('| ')) {
                return null; // 테이블은 복잡하므로 텍스트로만 표시
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={idx} className="font-semibold text-gray-900 mb-2">
                    {line.substring(2, line.length - 2)}
                  </p>
                );
              }
              if (line.trim() === '') {
                return <div key={idx} className="mb-2" />;
              }
              return (
                <p key={idx} className="text-gray-700 mb-2">
                  {line}
                </p>
              );
            })}
          </div>
        </Card>

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>이 링크는 누구나 볼 수 있습니다 (읽기 전용)</p>
        </div>
      </div>
    </div>
  );
}
