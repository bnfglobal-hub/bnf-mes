import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/** 현재 저장된 content/site.json 을 읽어온다 (편집 화면이 최신 내용으로 시작하도록). */
export async function GET() {
  try {
    const file = path.join(process.cwd(), "content", "site.json");
    const raw = await fs.readFile(file, "utf8");
    return new NextResponse(raw, {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "내용을 읽지 못했습니다: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
