import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/** 사진·영상 업로드 — public/uploads 에 저장하고 웹 경로를 돌려준다. 개발 모드 전용.
 *  파일은 JSON(base64)으로 받는다. */

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
};

const MAX_BYTES = 40 * 1024 * 1024; // 40MB

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "배포된 사이트에서는 업로드할 수 없습니다." }, { status: 403 });
  }

  let body: { name?: string; type?: string; data?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const ext = ALLOWED[body.type ?? ""];
  if (!ext) {
    return NextResponse.json(
      { error: "이미지(JPG·PNG·WEBP·GIF) 또는 MP4 영상만 올릴 수 있습니다." },
      { status: 400 }
    );
  }
  if (!body.data) {
    return NextResponse.json({ error: "파일 내용이 비어 있습니다." }, { status: 400 });
  }

  const buf = Buffer.from(body.data, "base64");
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "파일이 너무 큽니다 (최대 40MB)." }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });

  // 원본 이름을 살리되 안전한 문자만 남기고, 겹치면 뒤에 번호를 붙인다
  const base =
    (body.name ?? "image").replace(/\.[^.]+$/, "").replace(/[^가-힣a-zA-Z0-9._-]/g, "-").slice(0, 40) ||
    "image";
  let name = base + ext;
  let n = 1;
  for (;;) {
    try {
      await fs.access(path.join(dir, name));
      name = `${base}-${n++}${ext}`;
    } catch {
      break;
    }
  }

  await fs.writeFile(path.join(dir, name), buf);
  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
