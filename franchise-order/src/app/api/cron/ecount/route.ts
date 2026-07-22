import { NextResponse } from "next/server";
import { processSyncQueue, syncStocks } from "@/lib/ecount/service";

/**
 * 주기 실행용 엔드포인트 (Vercel Cron / 윈도우 예약작업 / GitHub Actions 등).
 * 호출: GET /api/cron/ecount?key=<CRON_SECRET>
 *  - 전송 큐 처리 + 재고 동기화
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 보낸다.
  // 수동 호출/윈도우 작업 스케줄러는 ?key= 로 인증한다.
  const url = new URL(request.url);
  const byHeader = request.headers.get("authorization") === `Bearer ${secret}`;
  const byQuery = url.searchParams.get("key") === secret;
  if (!byHeader && !byQuery) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const queue = await processSyncQueue(3);
  let stocks: { updated: number } | { error: string };
  try {
    stocks = await syncStocks();
  } catch (e) {
    stocks = { error: e instanceof Error ? e.message : String(e) };
  }
  return NextResponse.json({ ok: true, queue, stocks, at: new Date().toISOString() });
}
