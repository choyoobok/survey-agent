'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Survey } from '@/lib/types';

export default function Home() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const response = await fetch('/api/survey/list');
      const data = await response.json();
      setSurveys(data);
    } catch (err) {
      console.error('설문 로드 중 오류:', err);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">설문 종합 에이전트</h1>
          <p className="text-gray-600 mb-6">설문 생성, 응답 수집, 분석 리포트 생성 자동화</p>

          <Link href="/survey/create">
            <Button className="px-6 py-2">
              + 새 설문 만들기
            </Button>
          </Link>
        </div>

        {surveys.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">아직 만들어진 설문이 없습니다.</p>
            <p className="text-gray-400 text-sm">
              위의 '새 설문 만들기' 버튼을 클릭해 첫 설문을 시작해보세요.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {surveys.map((survey) => (
              <Card key={survey.id} className="p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {survey.title}
                </h2>
                <p className="text-gray-600 text-sm mb-4">{survey.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/survey/${survey.id}`}>
                    <Button variant="outline" size="sm">
                      응답 하기
                    </Button>
                  </Link>
                  <Link href={`/survey/${survey.id}/report`}>
                    <Button variant="outline" size="sm">
                      분석 보기
                    </Button>
                  </Link>
                  <Link href={`/survey/${survey.id}/share`}>
                    <Button variant="outline" size="sm">
                      공유 링크
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
