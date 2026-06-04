'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createSurvey } from '@/lib/db';
import { Survey } from '@/lib/types';

export default function CreateSurvey() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Survey | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');
    setPreview(null);

    try {
      const response = await fetch('/api/survey/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('설문 생성 실패');
      }

      const survey = await response.json();
      setPreview(survey);
    } catch (err) {
      setError(err instanceof Error ? err.message : '설문 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!preview) return;

    try {
      await createSurvey({
        title: preview.title,
        description: preview.description,
        questions: preview.questions
      });

      router.push('/');
    } catch (err) {
      setError('설문 저장 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">새 설문 생성</h1>
        <p className="text-gray-600 mb-8">자연어로 설문을 설명해주세요. AI가 자동으로 생성합니다.</p>

        <Card className="p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설문 프롬프트
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='예: "고객만족도 조사. 5점 등급 2개, NPS 1개, 의견 1개로 구성해"'
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '생성 중...' : '설문 생성'}
          </Button>
        </Card>

        {/* 미리보기 */}
        {preview && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{preview.title}</h2>
            <p className="text-gray-600 mb-6">{preview.description}</p>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">질문 미리보기</h3>
              <div className="space-y-4">
                {preview.questions.map((q, idx) => (
                  <div key={q.id} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {idx + 1}. {q.text}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      타입: {q.type} {q.required ? '(필수)' : '(선택)'}
                    </p>
                    {q.options && q.options.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {q.options.slice(0, 3).map((opt) => (
                          <li key={opt} className="text-sm text-gray-600">
                            • {opt}
                          </li>
                        ))}
                        {q.options.length > 3 && (
                          <li className="text-sm text-gray-500">
                            • 외 {q.options.length - 3}개
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                이 설문으로 생성
              </Button>
              <Button
                onClick={() => {
                  setPreview(null);
                  setPrompt('');
                }}
                variant="outline"
                className="flex-1"
              >
                다시 생성
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
