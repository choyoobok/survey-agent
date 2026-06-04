import { NextRequest, NextResponse } from 'next/server';
import { getResponses } from '@/lib/db-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const responses = await getResponses(params.id);
    return NextResponse.json(responses);
  } catch (error) {
    console.error('응답 조회 오류:', error);
    return NextResponse.json(
      { error: '응답을 가져올 수 없습니다' },
      { status: 500 }
    );
  }
}
