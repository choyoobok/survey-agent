import { NextResponse } from 'next/server';
import { getSurveys } from '@/lib/db-server';

export async function GET() {
  try {
    const surveys = await getSurveys();
    return NextResponse.json(surveys);
  } catch (error) {
    console.error('설문 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '설문 목록을 가져올 수 없습니다' },
      { status: 500 }
    );
  }
}
