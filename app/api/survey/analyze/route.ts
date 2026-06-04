import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface AnalyzeRequest {
  title: string;
  responseCount: number;
  statsText: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    const prompt = `다음 설문 결과를 요약하고 주요 인사이트를 뽑아주세요. 한국어로 3-5문장으로 작성해주세요.

설문: ${body.title}
응답자 수: ${body.responseCount}명

결과:${body.statsText}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const interpretation =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ interpretation });
  } catch (error) {
    console.error('분석 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}
