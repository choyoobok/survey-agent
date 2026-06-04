import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { createSurvey } from '@/lib/db-server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface SurveyRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SurveyRequest = await request.json();

    if (!body.prompt) {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다' },
        { status: 400 }
      );
    }

    const systemPrompt = `당신은 설문 디자인 전문가입니다.
사용자의 요청을 받으면 JSON 형식의 설문 구조를 생성합니다.
반드시 다음 JSON 형식을 따르세요:
{
  "title": "설문명",
  "description": "설명",
  "questions": [
    {
      "id": "q1",
      "type": "single" | "multiple" | "rating" | "nps" | "text",
      "text": "질문 텍스트",
      "options": ["선택지1", "선택지2"] (rating/nps/text는 필수 아님),
      "required": true/false
    }
  ]
}
JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: body.prompt
        }
      ]
    });

    let surveyJson = response.content[0].type === 'text' ? response.content[0].text : '';

    surveyJson = surveyJson
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim();

    const firstBrace = surveyJson.indexOf('{');
    const lastBrace = surveyJson.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
      console.error('JSON 추출 실패. 응답 내용:', surveyJson.substring(0, 300));
      throw new Error('응답에서 JSON을 찾을 수 없습니다');
    }

    surveyJson = surveyJson.substring(firstBrace, lastBrace + 1).trim();

    let survey;
    try {
      survey = JSON.parse(surveyJson);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError instanceof Error ? parseError.message : '알 수 없는 오류');
      console.error('JSON 내용 (처음 500자):', surveyJson.substring(0, 500));
      throw new Error('JSON 형식이 올바르지 않습니다');
    }

    // Supabase에 저장
    const savedSurvey = await createSurvey(survey);

    return NextResponse.json(savedSurvey);
  } catch (error) {
    console.error('설문 생성 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '설문 생성 중 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}
