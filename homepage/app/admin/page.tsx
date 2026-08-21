import type { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";
import Editor from "./Editor";

export const metadata: Metadata = {
  title: "홈페이지 내용 수정",
  robots: { index: false, follow: false },
};

/* 항상 저장된 최신 파일을 읽는다 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isProd = process.env.NODE_ENV === "production";
  const file = path.join(process.cwd(), "content", "site.json");
  const initial = JSON.parse(await fs.readFile(file, "utf8"));

  if (isProd) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-[20px] font-extrabold">여기서는 수정할 수 없습니다</h1>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          내용 수정은 회사 PC에서 <b>&lsquo;홈페이지 편집.bat&rsquo;</b> 파일을 두 번 눌러
          실행한 뒤, 열리는 편집 화면에서 해주세요.
          <br />
          수정하고 저장한 다음 배포하면 이 사이트에 반영됩니다.
        </p>
      </div>
    );
  }

  return <Editor initial={initial} />;
}
