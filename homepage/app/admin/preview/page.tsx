import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import HomeSections from "@/app/(site)/HomeSections";
import EditModeLoader from "@/app/(site)/EditModeLoader";

/** 편집기 캔버스 전용 화면.
 *  방문자 홈페이지와 **같은 렌더러**(HomeSections)를 쓰되, 내용만 작업본(draft)에서 가져온다.
 *  그래서 편집 중 추가한 섹션도 바로 보이고, 실제 화면과 모습이 어긋나지 않는다. */

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditorPreview() {
  if (process.env.NODE_ENV === "production") {
    return <p className="p-10 text-center text-[14px]">편집 미리보기는 회사 PC에서만 열립니다.</p>;
  }

  const dir = path.join(process.cwd(), "content");
  let raw: string;
  try {
    raw = await fs.readFile(path.join(dir, "site.draft.json"), "utf8");
  } catch {
    raw = await fs.readFile(path.join(dir, "site.json"), "utf8");
  }
  const draft = JSON.parse(raw);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <HomeSections data={draft} />
      </main>
      <Footer />
      <EditModeLoader />
    </div>
  );
}
