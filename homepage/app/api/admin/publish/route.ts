import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/** 게시 — 작업본(draft)을 실제 홈페이지 내용(site.json)으로 옮긴다.
 *  게시 전 내용은 content/_backups 에 자동 보관한다. */

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "배포된 사이트에서는 게시할 수 없습니다. 회사 PC에서 '홈페이지 편집.bat'을 실행해주세요." },
      { status: 403 }
    );
  }

  const dir = path.join(process.cwd(), "content");
  const draftFile = path.join(dir, "site.draft.json");
  const liveFile = path.join(dir, "site.json");
  const backupDir = path.join(dir, "_backups");

  try {
    // 본문으로 받은 내용이 있으면 그것을 우선 저장 (편집 중 내용 그대로 게시)
    let draftRaw: string;
    try {
      const body = await req.json();
      if (body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).length) {
        draftRaw = JSON.stringify(body, null, 2) + "\n";
        await fs.writeFile(draftFile, draftRaw, "utf8");
      } else {
        draftRaw = await fs.readFile(draftFile, "utf8");
      }
    } catch {
      draftRaw = await fs.readFile(draftFile, "utf8");
    }

    JSON.parse(draftRaw); // 형식 검사

    // 게시 전 백업 (최근 30개 유지)
    await fs.mkdir(backupDir, { recursive: true });
    try {
      const prev = await fs.readFile(liveFile, "utf8");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      await fs.writeFile(path.join(backupDir, `site-${stamp}.json`), prev, "utf8");
      const files = (await fs.readdir(backupDir)).filter((f) => f.endsWith(".json")).sort();
      for (const old of files.slice(0, Math.max(0, files.length - 30))) {
        await fs.unlink(path.join(backupDir, old));
      }
    } catch {
      /* 첫 게시면 백업할 이전 파일이 없다 */
    }

    await fs.writeFile(liveFile, draftRaw, "utf8");
    return NextResponse.json({ ok: true, publishedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: "게시 실패: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
