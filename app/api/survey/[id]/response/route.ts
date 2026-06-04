import { NextRequest, NextResponse } from 'next/server';
import { addResponse } from '@/lib/db-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await addResponse(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('응답 저장 오류:', error);
    return NextResponse.json(
      { error: '응답을 저장할 수 없습니다' },
      { status: 500 }
    );
  }
}
