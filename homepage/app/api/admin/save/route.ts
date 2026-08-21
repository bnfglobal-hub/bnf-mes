import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/** content/site.json 저장 — 개발 모드(내 PC에서 편집할 때)에서만 동작한다.
 *  배포된 사이트에서는 파일을 쓸 수 없으므로 차단된다. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "배포된 사이트에서는 저장할 수 없습니다. 내 PC에서 '홈페이지 편집.bat'을 실행해 수정해주세요." },
      { status: 403 }
    );
  }

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "저장할 내용이 올바르지 않습니다." }, { status: 400 });
  }

  const file = path.join(process.cwd(), "content", "site.json");
  const backupDir = path.join(process.cwd(), "content", "_backups");

  try {
    // 저장 전 자동 백업 (되돌리기용, 최근 30개 유지)
    await fs.mkdir(backupDir, { recursive: true });
    try {
      const prev = await fs.readFile(file, "utf8");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      await fs.writeFile(path.join(backupDir, `site-${stamp}.json`), prev, "utf8");
      const files = (await fs.readdir(backupDir)).filter((f) => f.endsWith(".json")).sort();
      for (const old of files.slice(0, Math.max(0, files.length - 30))) {
        await fs.unlink(path.join(backupDir, old));
      }
    } catch {
      /* 첫 저장이면 백업할 이전 파일이 없다 */
    }

    await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: "저장 실패: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
