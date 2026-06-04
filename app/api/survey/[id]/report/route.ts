import { NextRequest, NextResponse } from 'next/server';
import { getReport, getResponses, saveReport } from '@/lib/db-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await getReport(id);
    if (!report) {
      return NextResponse.json(
        { error: '리포트가 없습니다' },
        { status: 404 }
      );
    }
    return NextResponse.json(report);
  } catch (error) {
    console.error('리포트 조회 오류:', error);
    return NextResponse.json(
      { error: '리포트를 가져올 수 없습니다' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { markdown, stats } = body;

    if (!markdown || !stats) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    await saveReport(id, markdown, stats);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('리포트 저장 오류:', error);
    return NextResponse.json(
      { error: '리포트를 저장할 수 없습니다' },
      { status: 500 }
    );
  }
}
