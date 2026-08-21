/** 섹션 추가 창에서 고를 수 있는 미리 만들어진 구성들.
 *  고르면 content.customSections 에 새 항목으로 들어가고 홈 화면에 바로 나타난다. */

export type Template = {
  key: string;
  group: "기본" | "이미지" | "강조";
  name: string;
  desc: string;
  type: string;
  content: Record<string, unknown>;
};

export const TEMPLATES: Template[] = [
  {
    key: "imageText",
    group: "이미지",
    name: "이미지 + 텍스트",
    desc: "왼쪽 사진, 오른쪽 설명",
    type: "imageText",
    content: {
      title: "새 소개 제목",
      body: "여기에 설명을 적어주세요.\n두 줄 이상 쓸 수 있습니다.",
      image: "",
      buttonText: "",
      buttonLink: "/support/oem",
    },
  },
  {
    key: "textImage",
    group: "이미지",
    name: "텍스트 + 이미지",
    desc: "왼쪽 설명, 오른쪽 사진",
    type: "textImage",
    content: {
      title: "새 소개 제목",
      body: "여기에 설명을 적어주세요.",
      image: "",
      buttonText: "",
      buttonLink: "/support/oem",
    },
  },
  {
    key: "gallery",
    group: "이미지",
    name: "사진 모음",
    desc: "사진을 4장씩 나란히",
    type: "gallery",
    content: {
      title: "사진 모음",
      subtitle: "",
      images: [],
    },
  },
  {
    key: "banner",
    group: "이미지",
    name: "이미지 배너",
    desc: "큰 사진 위에 문구",
    type: "banner",
    content: {
      title: "배너 문구를 적어주세요",
      image: "",
      buttonText: "",
      buttonLink: "/support/oem",
      height: "clamp(240px,34vh,420px)",
    },
  },
  {
    key: "video",
    group: "이미지",
    name: "영상 배너",
    desc: "배경 영상 위에 문구",
    type: "video",
    content: {
      title: "영상 위 문구",
      body: "",
      video: "",
      buttonText: "",
      buttonLink: "/support/oem",
      height: "clamp(360px,50vh,560px)",
    },
  },
  {
    key: "text",
    group: "기본",
    name: "텍스트",
    desc: "제목과 본문만",
    type: "text",
    content: {
      title: "제목",
      subtitle: "",
      body: "내용을 적어주세요.",
      buttonText: "",
      buttonLink: "",
    },
  },
  {
    key: "stats",
    group: "강조",
    name: "숫자 강조",
    desc: "실적·수치를 크게",
    type: "stats",
    content: {
      title: "",
      items: [
        { value: "1990", label: "창업" },
        { value: "7건", label: "HACCP 인증" },
        { value: "2,000+", label: "취급 품목" },
        { value: "-38℃", label: "급속 냉동" },
      ],
    },
  },
  {
    key: "cta",
    group: "강조",
    name: "문의 유도",
    desc: "문의 버튼이 있는 안내 상자",
    type: "cta",
    content: {
      title: "제품 제조를 검토 중이신가요?",
      body: "품목과 수량을 알려주시면 상담부터 양산까지 안내해 드립니다.",
      buttonText: "OEM 견적 문의",
      buttonLink: "/support/oem",
    },
  },
  {
    key: "spacer",
    group: "기본",
    name: "여백",
    desc: "섹션 사이 빈 공간",
    type: "spacer",
    content: { height: "60px" },
  },
];

export function newId() {
  return "cs_" + Math.random().toString(36).slice(2, 8);
}
