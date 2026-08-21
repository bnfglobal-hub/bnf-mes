import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/** 작업본(draft) 읽기·저장.
 *  - GET  : 현재 작업본. 없으면 게시본을 복사해 만든다.
 *  - POST : 작업본 저장 (게시본은 건드리지 않는다 → 실제 홈페이지는 그대로) */

const dir = () => path.join(process.cwd(), "content");
const draftFile = () => path.join(dir(), "site.draft.json");
const liveFile = () => path.join(dir(), "site.json");

const devOnly = () =>
  process.env.NODE_ENV === "production"
    ? NextResponse.json(
        { error: "배포된 사이트에서는 편집할 수 없습니다. 회사 PC에서 '홈페이지 편집.bat'을 실행해주세요." },
        { status: 403 }
      )
    : null;

export async function GET() {
  try {
    let raw: string;
    try {
      raw = await fs.readFile(draftFile(), "utf8");
    } catch {
      raw = await fs.readFile(liveFile(), "utf8");
      await fs.writeFile(draftFile(), raw, "utf8");
    }
    const live = await fs.readFile(liveFile(), "utf8");
    return NextResponse.json(
      { draft: JSON.parse(raw), published: JSON.parse(live) },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "작업본을 읽지 못했습니다: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const blocked = devOnly();
  if (blocked) return blocked;

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "저장할 내용이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    await fs.writeFile(draftFile(), JSON.stringify(data, null, 2) + "\n", "utf8");
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: "저장 실패: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
