import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/** public/uploads 안의 파일 목록 — 보관함에서 이미 올린 파일을 다시 쓰기 위해. */

const EXT: Record<string, "image" | "video"> = {
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
  ".gif": "image",
  ".mp4": "video",
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ items: [] });
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    const names = await fs.readdir(dir);
    const items = await Promise.all(
      names
        .filter((n) => EXT[path.extname(n).toLowerCase()])
        .map(async (n) => {
          const st = await fs.stat(path.join(dir, n));
          return {
            url: `/uploads/${n}`,
            name: n,
            type: EXT[path.extname(n).toLowerCase()],
            size: st.size,
            at: st.mtime.toISOString(),
          };
        })
    );
    items.sort((a, b) => b.at.localeCompare(a.at));
    return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
