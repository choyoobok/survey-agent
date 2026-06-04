'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getSurvey, addResponse } from '@/lib/db';
import { Survey } from '@/lib/types';

export default function ResponseForm() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      const data = await getSurvey(surveyId);
      if (!data) {
        setError('설문을 찾을 수 없습니다');
      } else {
        setSurvey(data);
      }
    } catch (err) {
      setError('설문 로드 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    // 필수 항목 검증
    if (!survey) return;

    const required = survey.questions.filter((q) => q.required);
    const missing = required.filter((q) => !responses[q.id]);

    if (missing.length > 0) {
      setError(`필수 질문을 모두 답변해주세요: ${missing.map((q) => q.text).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addResponse(surveyId, responses);
      router.push(`/survey/${surveyId}/report`);
    } catch (err) {
      setError('응답 저장 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '설문을 찾을 수 없습니다'}</p>
          <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
        <p className="text-gray-600 mb-8">{survey.description}</p>

        <form className="space-y-6">
          {survey.questions.map((question, idx) => (
            <Card key={question.id} className="p-6">
              <label className="block text-lg font-medium text-gray-900 mb-4">
                {idx + 1}. {question.text}
                {question.required && <span className="text-red-600"> *</span>}
              </label>

              {/* rating / nps 슬라이더 */}
              {(question.type === 'rating' || question.type === 'nps') && (
                <div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[responses[question.id] || (question.type === 'rating' ? 3 : 5)]}
                      onValueChange={(value) => handleResponse(question.id, value[0])}
                      min={question.type === 'rating' ? 1 : 0}
                      max={question.type === 'rating' ? 5 : 10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold text-blue-600 min-w-[3rem]">
                      {responses[question.id] || (question.type === 'rating' ? 3 : 5)}
                      {question.type === 'nps' ? '/10' : '/5'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{question.type === 'rating' ? '불만족' : '추천 안 함'}</span>
                    <span>{question.type === 'rating' ? '만족' : '매우 추천'}</span>
                  </div>
                </div>
              )}

              {/* single choice 라디오 */}
              {question.type === 'single' && question.options && (
                <RadioGroup value={responses[question.id] || ''} onValueChange={(value) => handleResponse(question.id, value)}>
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <label htmlFor={`${question.id}-${option}`} className="text-gray-700 cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* multiple choice 체크박스 */}
              {question.type === 'multiple' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-${option}`}
                        checked={(responses[question.id] || []).includes(option)}
                        onCheckedChange={(checked) => {
                          const current = responses[question.id] || [];
                          const updated = checked
                            ? [...current, option]
                            : current.filter((v: string) => v !== option);
                          handleResponse(question.id, updated);
                        }}
                      />
                      <label htmlFor={`${question.id}-${option}`} className="text-gray-700 cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* text 입력 */}
              {question.type === 'text' && (
                <textarea
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  placeholder="의견을 작성해주세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              )}
            </Card>
          ))}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
          >
            {isSubmitting ? '제출 중...' : '응답 제출'}
          </Button>
        </form>
      </div>
    </div>
  );
}
