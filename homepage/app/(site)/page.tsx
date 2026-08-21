import HomeSections from "./HomeSections";
import { content } from "@/lib/content";

/* 방문자용 홈 화면 — 게시본(content/site.json)으로 그린다.
   편집기 캔버스(/admin/preview)는 같은 HomeSections 를 작업본으로 그린다. */
export default function Home() {
  return <HomeSections data={content} />;
}
