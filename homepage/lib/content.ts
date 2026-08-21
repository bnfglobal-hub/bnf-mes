import raw from "../content/site.json";

/** 사이트의 모든 글·사진은 content/site.json 한 곳에서 관리한다.
 *  화면(/admin)에서 고치면 이 파일이 갱신된다. */
export const content = raw;

export type Content = typeof raw;
export type Company = Content["company"];

export const company = raw.company;

/** 줄바꿈(\n)이 들어간 텍스트를 문단 배열로 */
export function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
}

/** 줄바꿈(\n) 한 번은 <br>로 쓰기 위해 줄 배열로 */
export function lines(text: string): string[] {
  return text.split("\n");
}
