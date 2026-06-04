import { NextRequest, NextResponse } from 'next/server';
import { getSurvey } from '@/lib/db-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const survey = await getSurvey(params.id);
    if (!survey) {
      return NextResponse.json(
        { error: '설문을 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    return NextResponse.json(survey);
  } catch (error) {
    console.error('설문 조회 오류:', error);
    return NextResponse.json(
      { error: '설문을 가져올 수 없습니다' },
      { status: 500 }
    );
  }
}
