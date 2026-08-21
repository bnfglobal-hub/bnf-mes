import type { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";
import Editor from "./Editor";

export const metadata: Metadata = {
  title: "홈페이지 편집기",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-[20px] font-extrabold">여기서는 편집할 수 없습니다</h1>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          회사 PC에서 <b>&lsquo;홈페이지 편집.bat&rsquo;</b> 을 두 번 눌러 실행한 뒤 편집해주세요.
        </p>
      </div>
    );
  }

  const dir = path.join(process.cwd(), "content");
  let raw: string;
  try {
    raw = await fs.readFile(path.join(dir, "site.draft.json"), "utf8");
  } catch {
    raw = await fs.readFile(path.join(dir, "site.json"), "utf8");
  }

  return <Editor initial={JSON.parse(raw)} />;
}
