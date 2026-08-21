"use client";

import { useEffect, useState } from "react";
import { Text, TextArea, ImagePick, StringList, CardList, Field, inputCls } from "./fields";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SECTIONS = [
  { id: "company", label: "회사 정보", desc: "전화·주소·사업자번호 — 모든 페이지에 반영" },
  { id: "home", label: "홈 화면", desc: "첫 화면 영상·문구·사진" },
  { id: "greeting", label: "인사말", desc: "" },
  { id: "history", label: "회사연혁", desc: "" },
  { id: "business", label: "사업분야", desc: "" },
  { id: "manufacturing", label: "식품제조", desc: "공정·품목·포장" },
  { id: "certification", label: "인증현황", desc: "" },
  { id: "hmr", label: "HMR(내수용)", desc: "납품 제품 목록" },
  { id: "products", label: "그 밖의 제품", desc: "수입·유지·냉동·소스·면류·수산물·기타" },
  { id: "support", label: "고객센터", desc: "OEM 견적·문의" },
];

export default function Editor({ initial }: { initial: any }) {
  const [data, setData] = useState<any>(initial);
  const [saved, setSaved] = useState<any>(initial);
  const [tab, setTab] = useState("company");
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "ok" | "err"; msg?: string }>({
    kind: "idle",
  });

  const dirty = JSON.stringify(data) !== JSON.stringify(saved);

  // 저장 안 한 채 창을 닫으려 하면 경고
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // Ctrl+S 로 저장
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const save = async () => {
    setStatus({ kind: "saving" });
    try {
      const r = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "저장 실패");
      setSaved(JSON.parse(JSON.stringify(data)));
      setStatus({ kind: "ok", msg: "저장했습니다" });
      setTimeout(() => setStatus({ kind: "idle" }), 2500);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  /** 특정 경로의 값을 바꾼다 (예: set("company.tel", "1688-0000")) */
  const set = (path: string, value: any) => {
    setData((prev: any) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let cur = next;
      for (const k of keys.slice(0, -1)) cur = cur[k];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };
  const get = (path: string) => path.split(".").reduce((o, k) => o?.[k], data);

  return (
    <div className="min-h-dvh bg-[#f7f7f7] text-[#1a1a1a]">
      {/* 상단 바 */}
      <header className="sticky top-0 z-30 border-b border-[#ddd] bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-5">
          <h1 className="text-[16px] font-extrabold">홈페이지 내용 수정</h1>
          <span className="hidden text-[12.5px] text-[#888] sm:inline">
            고친 뒤 <b>저장</b>을 누르세요 (Ctrl+S)
          </span>

          <div className="ml-auto flex items-center gap-2.5">
            {status.kind === "ok" && (
              <span className="text-[13px] font-bold text-[#15803d]">✓ {status.msg}</span>
            )}
            {status.kind === "err" && (
              <span className="max-w-[380px] truncate text-[13px] font-bold text-[#c00]" title={status.msg}>
                ✕ {status.msg}
              </span>
            )}
            {dirty && status.kind === "idle" && (
              <span className="text-[12.5px] font-bold text-[#b45309]">저장 안 한 수정이 있습니다</span>
            )}

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="border border-[#ddd] px-4 py-2.5 text-[13px] font-bold transition-colors hover:border-[#333]"
            >
              홈페이지 보기 ↗
            </a>
            <button
              type="button"
              onClick={save}
              disabled={status.kind === "saving" || !dirty}
              className="bg-[#e8261e] px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#c41c15] disabled:cursor-not-allowed disabled:bg-[#ccc]"
            >
              {status.kind === "saving" ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-5 py-6">
        {/* 왼쪽 메뉴 */}
        <nav className="sticky top-[88px] hidden h-fit w-[220px] shrink-0 lg:block">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTab(s.id)}
              className={`mb-1 block w-full border-l-[3px] px-4 py-3 text-left transition-colors ${
                tab === s.id
                  ? "border-[#e8261e] bg-white font-extrabold text-[#e8261e]"
                  : "border-transparent text-[#555] hover:bg-white"
              }`}
            >
              <span className="block text-[13.5px]">{s.label}</span>
              {s.desc && <span className="mt-0.5 block text-[11.5px] text-[#999]">{s.desc}</span>}
            </button>
          ))}
        </nav>

        {/* 모바일 메뉴 */}
        <div className="lg:hidden">
          <select
            className={`${inputCls} mb-4`}
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            aria-label="수정할 항목 선택"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* 편집 영역 */}
        <main className="min-w-0 flex-1 bg-white p-6 sm:p-8">
          {tab === "company" && <CompanyTab get={get} set={set} />}
          {tab === "home" && <HomeTab data={data} get={get} set={set} />}
          {tab === "greeting" && <GreetingTab get={get} set={set} />}
          {tab === "history" && <HistoryTab data={data} set={set} />}
          {tab === "business" && <BusinessTab data={data} get={get} set={set} />}
          {tab === "manufacturing" && <ManufacturingTab data={data} get={get} set={set} />}
          {tab === "certification" && <CertificationTab data={data} get={get} set={set} />}
          {tab === "hmr" && <HmrTab data={data} get={get} set={set} />}
          {tab === "products" && <ProductsTab data={data} get={get} set={set} />}
          {tab === "support" && <SupportTab data={data} get={get} set={set} />}
        </main>
      </div>
    </div>
  );
}

/* ───────── 각 탭 ───────── */

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 border-b-2 border-[#222] pb-2 text-[17px] font-extrabold">{children}</h2>;
}

type TabProps = { data?: any; get: (p: string) => any; set: (p: string, v: any) => void };

function CompanyTab({ get, set }: TabProps) {
  const t = (label: string, path: string, hint?: string) => (
    <Text label={label} hint={hint} value={get(path)} onChange={(v) => set(path, v)} />
  );
  return (
    <>
      <H>회사 정보</H>
      <p className="mb-6 bg-[#fff8f0] p-4 text-[13px] leading-relaxed text-[#8a5a20]">
        여기 값은 <b>모든 페이지의 머리말·꼬리말</b>에 함께 반영됩니다.
      </p>
      <div className="grid gap-x-6 sm:grid-cols-2">
        {t("회사명", "company.name")}
        {t("영문명", "company.nameEn")}
        {t("대표", "company.ceo")}
        {t("개인정보관리책임자", "company.privacyOfficer")}
        {t("대표번호", "company.tel")}
        {t("사업자등록번호", "company.bizNo")}
        {t("통신판매 신고번호", "company.mailOrderNo")}
        {t("쇼핑몰 주소", "company.shopUrl")}
      </div>

      <h3 className="mb-4 mt-4 text-[15px] font-extrabold">본사</h3>
      <div className="grid gap-x-6 sm:grid-cols-2">
        {t("표시 이름", "company.hq.name")}
        {t("주소", "company.hq.addr", "지도에도 이 주소가 쓰입니다")}
        {t("전화", "company.hq.tel")}
        {t("팩스", "company.hq.fax")}
      </div>

      <h3 className="mb-4 mt-4 text-[15px] font-extrabold">제조공장</h3>
      <div className="grid gap-x-6 sm:grid-cols-2">
        {t("표시 이름", "company.factory.name")}
        {t("주소", "company.factory.addr")}
        {t("전화", "company.factory.tel")}
        {t("팩스", "company.factory.fax")}
      </div>

      <ImagePick label="로고" value={get("company.logo")} onChange={(v) => set("company.logo", v)} />
    </>
  );
}

function HomeTab({ data, get, set }: TabProps) {
  return (
    <>
      <H>홈 화면</H>

      <ImagePick
        label="첫 화면 배경 영상"
        hint="MP4 파일"
        value={get("home.heroVideo")}
        onChange={(v) => set("home.heroVideo", v)}
      />
      <Text label="영문 문구" value={get("home.heroTitleEn")} onChange={(v) => set("home.heroTitleEn", v)} />
      <TextArea
        label="한글 문구"
        rows={3}
        value={get("home.heroTitleKo")}
        onChange={(v) => set("home.heroTitleKo", v)}
      />

      <CardList
        label="소개 영상 (유튜브)"
        hint="영상 주소의 v= 뒤 글자만 넣으세요"
        value={data.home.videos}
        onChange={(v) => set("home.videos", v)}
        blank={() => ({ id: "", title: "" })}
        addLabel="+ 영상 추가"
        render={(v: any, s) => (
          <div className="grid gap-x-5 sm:grid-cols-2">
            <Text label="영상 ID" hint="예: fd5kjjPfM0w" value={v.id} onChange={(x) => s({ id: x })} />
            <Text label="영상 제목" value={v.title} onChange={(x) => s({ title: x })} />
          </div>
        )}
      />

      <CardList
        label="가운데 소개 카드"
        value={data.home.cards}
        onChange={(v) => set("home.cards", v)}
        blank={() => ({ title: "", desc: "", image: "", link: "/" })}
        addLabel="+ 카드 추가"
        render={(c: any, s) => (
          <>
            <Text label="제목" value={c.title} onChange={(x) => s({ title: x })} />
            <TextArea label="설명" rows={2} hint="" value={c.desc} onChange={(x) => s({ desc: x })} />
            <ImagePick label="사진" value={c.image} onChange={(x) => s({ image: x })} />
            <Text label="눌렀을 때 이동할 페이지" hint="예: /company/manufacturing" value={c.link} onChange={(x) => s({ link: x })} />
          </>
        )}
      />

      <H>PRODUCT 구역</H>
      <Text label="제목" value={get("home.productTitle")} onChange={(v) => set("home.productTitle", v)} />
      <TextArea label="설명" rows={3} value={get("home.productDesc")} onChange={(v) => set("home.productDesc", v)} />
      <Text label="버튼 글자" value={get("home.productButton")} onChange={(v) => set("home.productButton", v)} />

      <CardList
        label="제품 사진"
        hint="4장씩 두 줄로 보입니다"
        value={data.home.productPhotos.map((p: string) => ({ image: p }))}
        onChange={(v: any[]) => set("home.productPhotos", v.map((x) => x.image))}
        blank={() => ({ image: "" })}
        addLabel="+ 사진 추가"
        render={(p: any, s) => <ImagePick label="사진" value={p.image} onChange={(x) => s({ image: x })} />}
      />

      <Text label="오시는 길 제목" value={get("home.locationTitle")} onChange={(v) => set("home.locationTitle", v)} />
    </>
  );
}

function GreetingTab({ get, set }: TabProps) {
  return (
    <>
      <H>인사말</H>
      <Text label="큰 제목" value={get("greeting.headline")} onChange={(v) => set("greeting.headline", v)} />
      <TextArea label="본문" rows={12} value={get("greeting.body")} onChange={(v) => set("greeting.body", v)} />
      <Text label="서명" value={get("greeting.signature")} onChange={(v) => set("greeting.signature", v)} />
      <ImagePick label="오른쪽 사진" value={get("greeting.image")} onChange={(v) => set("greeting.image", v)} onRemove={() => set("greeting.image", "")} />
    </>
  );
}

function HistoryTab({ data, set }: { data: any; set: (p: string, v: any) => void }) {
  return (
    <>
      <H>회사연혁</H>
      <CardList
        label="연도별 내용"
        hint="위에 있는 것이 먼저 나옵니다"
        value={data.history}
        onChange={(v) => set("history", v)}
        blank={() => ({ year: "", events: [""] })}
        addLabel="+ 연도 추가"
        render={(h: any, s) => (
          <>
            <Text label="연도" value={h.year} onChange={(x) => s({ year: x })} />
            <StringList label="그 해의 일" value={h.events} onChange={(x) => s({ events: x })} />
          </>
        )}
      />
    </>
  );
}

function BusinessTab({ data, get, set }: TabProps) {
  return (
    <>
      <H>사업분야</H>
      <ImagePick label="왼쪽 도식 사진" value={get("business.image")} onChange={(v) => set("business.image", v)} onRemove={() => set("business.image", "")} />
      <CardList
        label="사업 영역"
        value={data.business.areas}
        onChange={(v) => set("business.areas", v)}
        blank={() => ({ title: "", sub: "", rows: [{ key: "", value: "" }] })}
        addLabel="+ 영역 추가"
        render={(a: any, s) => (
          <>
            <div className="grid gap-x-5 sm:grid-cols-2">
              <Text label="영역 이름" value={a.title} onChange={(x) => s({ title: x })} />
              <Text label="부제목" hint="없으면 비워두세요" value={a.sub} onChange={(x) => s({ sub: x })} />
            </div>
            <CardList
              label="세부 항목"
              value={a.rows}
              onChange={(x) => s({ rows: x })}
              blank={() => ({ key: "", value: "" })}
              addLabel="+ 세부 항목"
              render={(r: any, rs) => (
                <>
                  <Text label="항목명" value={r.key} onChange={(x) => rs({ key: x })} />
                  <TextArea label="설명" rows={2} hint="" value={r.value} onChange={(x) => rs({ value: x })} />
                </>
              )}
            />
          </>
        )}
      />
    </>
  );
}

function ManufacturingTab({ data, get, set }: TabProps) {
  return (
    <>
      <H>식품제조</H>
      <StringList
        label="제조 프로세스 단계"
        hint="번호는 자동으로 붙습니다"
        value={data.manufacturing.process}
        onChange={(v) => set("manufacturing.process", v)}
      />
      <TextArea label="프로세스 아래 설명" rows={3} value={get("manufacturing.processNote")} onChange={(v) => set("manufacturing.processNote", v)} />

      <CardList
        label="제조 품목"
        value={data.manufacturing.items}
        onChange={(v) => set("manufacturing.items", v)}
        blank={() => ({ title: "", sub: "", desc: "" })}
        addLabel="+ 품목 추가"
        render={(it: any, s) => (
          <>
            <div className="grid gap-x-5 sm:grid-cols-2">
              <Text label="품목명" value={it.title} onChange={(x) => s({ title: x })} />
              <Text label="괄호 설명" hint="예: (냉동 밀키트)" value={it.sub} onChange={(x) => s({ sub: x })} />
            </div>
            <TextArea label="세부 내용" rows={2} hint="" value={it.desc} onChange={(x) => s({ desc: x })} />
          </>
        )}
      />

      <CardList
        label="포장 형태"
        value={data.manufacturing.packagingTypes}
        onChange={(v) => set("manufacturing.packagingTypes", v)}
        blank={() => ({ title: "", desc: "", note: "" })}
        addLabel="+ 포장 형태 추가"
        render={(t: any, s) => (
          <>
            <Text label="형태 이름" value={t.title} onChange={(x) => s({ title: x })} />
            <TextArea label="설명" rows={2} hint="" value={t.desc} onChange={(x) => s({ desc: x })} />
            <Text label="※ 참고 문구" value={t.note} onChange={(x) => s({ note: x })} />
          </>
        )}
      />

      <CardList
        label="포장 가능 규격"
        value={data.manufacturing.packagingSpecs}
        onChange={(v) => set("manufacturing.packagingSpecs", v)}
        blank={() => ({ key: "", value: "" })}
        addLabel="+ 규격 추가"
        render={(p: any, s) => (
          <div className="grid gap-x-5 sm:grid-cols-2">
            <Text label="유형" value={p.key} onChange={(x) => s({ key: x })} />
            <Text label="가능 규격" value={p.value} onChange={(x) => s({ value: x })} />
          </div>
        )}
      />

      <CardList
        label="아래쪽 안내 이미지"
        value={data.manufacturing.images.map((i: string) => ({ image: i }))}
        onChange={(v: any[]) => set("manufacturing.images", v.map((x) => x.image))}
        blank={() => ({ image: "" })}
        addLabel="+ 이미지 추가"
        render={(im: any, s) => <ImagePick label="이미지" value={im.image} onChange={(x) => s({ image: x })} />}
      />
    </>
  );
}

function CertificationTab({ data, get, set }: TabProps) {
  return (
    <>
      <H>인증현황</H>
      <TextArea label="상단 설명" rows={2} value={get("certification.lead")} onChange={(v) => set("certification.lead", v)} />
      <CardList
        label="인증 목록"
        value={data.certification.list}
        onChange={(v) => set("certification.list", v)}
        blank={() => ({ group: "HACCP", title: "" })}
        addLabel="+ 인증 추가"
        render={(c: any, s) => (
          <div className="grid gap-x-5 sm:grid-cols-[160px_1fr]">
            <Field label="분류">
              <select className={inputCls} value={c.group} onChange={(e) => s({ group: e.target.value })}>
                {["HACCP", "연구·기술", "특허", "기타"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Text label="인증 이름" value={c.title} onChange={(x) => s({ title: x })} />
          </div>
        )}
      />
      <ImagePick label="인증서 모음 이미지" value={get("certification.image")} onChange={(v) => set("certification.image", v)} onRemove={() => set("certification.image", "")} />
    </>
  );
}

function HmrTab({ data, get, set }: TabProps) {
  const [q, setQ] = useState("");
  const items = data.hmr.items as any[];
  const shown = q
    ? items.map((it, i) => ({ it, i })).filter(({ it }) => (it.brand + it.name).includes(q))
    : items.map((it, i) => ({ it, i }));

  const patch = (i: number, p: any) =>
    set("hmr.items", items.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <>
      <H>HMR(내수용) 납품 제품</H>
      <TextArea label="상단 설명" rows={2} value={get("hmr.lead")} onChange={(v) => set("hmr.lead", v)} />
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Text label="아래 안내 제목" value={get("hmr.ctaTitle")} onChange={(v) => set("hmr.ctaTitle", v)} />
        <Text label="아래 안내 설명" value={get("hmr.ctaDesc")} onChange={(v) => set("hmr.ctaDesc", v)} />
      </div>

      <div className="mb-4 mt-8 flex flex-wrap items-center gap-3">
        <h3 className="text-[15px] font-extrabold">제품 {items.length}개</h3>
        <input
          className={`${inputCls} max-w-[240px]`}
          placeholder="브랜드·제품명 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          onClick={() => set("hmr.items", [{ brand: "", name: "", image: "" }, ...items])}
          className="border border-dashed border-[#bbb] px-4 py-2.5 text-[12.5px] font-bold text-[#555] transition-colors hover:border-[#e8261e] hover:text-[#e8261e]"
        >
          + 맨 앞에 제품 추가
        </button>
      </div>

      <div className="space-y-3">
        {shown.map(({ it, i }) => (
          <div key={i} className="flex flex-wrap items-start gap-4 border border-[#e2e2e2] bg-white p-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden border border-[#ddd] bg-[#f5f5f5]">
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[11px] text-[#aaa]">없음</span>
              )}
            </div>
            <div className="min-w-[260px] flex-1">
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Text label="브랜드" value={it.brand} onChange={(x) => patch(i, { brand: x })} />
                <Text label="제품명" value={it.name} onChange={(x) => patch(i, { name: x })} />
              </div>
              <ImagePick label="사진" value={it.image} onChange={(x) => patch(i, { image: x })} />
            </div>
            <button
              type="button"
              onClick={() => set("hmr.items", items.filter((_, j) => j !== i))}
              className="grid h-9 w-9 shrink-0 place-items-center border border-[#ddd] text-[13px] text-[#c00] transition-colors hover:border-[#c00]"
              title="이 제품 삭제"
            >
              ✕
            </button>
          </div>
        ))}
        {shown.length === 0 && <p className="py-8 text-center text-[13px] text-[#999]">검색 결과가 없습니다</p>}
      </div>
    </>
  );
}

function ProductsTab({ data, get, set }: TabProps) {
  const [sub, setSub] = useState("import");
  const SUBS = [
    { id: "import", label: "수입 제품" },
    { id: "oil", label: "식용 유지" },
    { id: "frozen", label: "냉동 수산/축산" },
    { id: "hmrExport", label: "HMR(수출용)" },
    { id: "sauce", label: "소스/육수" },
    { id: "noodle", label: "면류" },
    { id: "seafood", label: "수산물가공품/절임" },
    { id: "etc", label: "기타 가공품" },
  ];

  const imgList = (path: string, label: string) => (
    <CardList
      label={label}
      value={(get(path) as string[]).map((i) => ({ image: i }))}
      onChange={(v: any[]) => set(path, v.map((x) => x.image))}
      blank={() => ({ image: "" })}
      addLabel="+ 사진 추가"
      render={(im: any, s) => <ImagePick label="사진" value={im.image} onChange={(x) => s({ image: x })} />}
    />
  );

  const groupList = (path: string) => (
    <CardList
      label="분류별 품목"
      value={get(path)}
      onChange={(v) => set(path, v)}
      blank={() => ({ title: "", items: [""] })}
      addLabel="+ 분류 추가"
      render={(g: any, s) => (
        <>
          <Text label="분류 이름" value={g.title} onChange={(x) => s({ title: x })} />
          <StringList label="품목" value={g.items} onChange={(x) => s({ items: x })} />
        </>
      )}
    />
  );

  return (
    <>
      <H>그 밖의 제품 페이지</H>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {SUBS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSub(s.id)}
            className={`border px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
              sub === s.id ? "border-[#e8261e] bg-[#e8261e] text-white" : "border-[#ddd] hover:border-[#333]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sub === "import" && (
        <>
          <Text label="제목" value={get("import.title")} onChange={(v) => set("import.title", v)} />
          <Text label="원산지 문구" value={get("import.origin")} onChange={(v) => set("import.origin", v)} />
          {imgList("import.images", "사진")}
          <ImagePick label="아래 큰 이미지" value={get("import.heroImage")} onChange={(v) => set("import.heroImage", v)} onRemove={() => set("import.heroImage", "")} />
        </>
      )}

      {sub === "oil" && (
        <>
          <Text label="제목" value={get("oil.title")} onChange={(v) => set("oil.title", v)} />
          {groupList("oil.groups")}
          {imgList("oil.images", "오른쪽 사진")}
        </>
      )}

      {sub === "frozen" && (
        <>
          <CardList
            label="취급 분류"
            value={data.frozen.categories}
            onChange={(v) => set("frozen.categories", v)}
            blank={() => ({ title: "", count: "", desc: "", form: "" })}
            addLabel="+ 분류 추가"
            render={(c: any, s) => (
              <>
                <div className="grid gap-x-5 sm:grid-cols-2">
                  <Text label="분류 이름" value={c.title} onChange={(x) => s({ title: x })} />
                  <Text label="품목 수" hint="예: 500여 품목" value={c.count} onChange={(x) => s({ count: x })} />
                </div>
                <TextArea label="세부 품목" rows={2} hint="" value={c.desc} onChange={(x) => s({ desc: x })} />
                <Text label="형태 표시" hint="예: 원물 · 절단가공" value={c.form} onChange={(x) => s({ form: x })} />
              </>
            )}
          />
          <ImagePick label="아래 큰 이미지" value={get("frozen.heroImage")} onChange={(v) => set("frozen.heroImage", v)} onRemove={() => set("frozen.heroImage", "")} />
        </>
      )}

      {sub === "hmrExport" && (
        <>
          <TextArea label="상단 설명" rows={2} value={get("hmrExport.lead")} onChange={(v) => set("hmrExport.lead", v)} />
          <ImagePick label="큰 이미지" value={get("hmrExport.heroImage")} onChange={(v) => set("hmrExport.heroImage", v)} onRemove={() => set("hmrExport.heroImage", "")} />
          <Text label="아래 안내 제목" value={get("hmrExport.ctaTitle")} onChange={(v) => set("hmrExport.ctaTitle", v)} />
          <TextArea label="아래 안내 설명" rows={2} value={get("hmrExport.ctaDesc")} onChange={(v) => set("hmrExport.ctaDesc", v)} />
        </>
      )}

      {sub === "sauce" && (
        <>
          <TextArea label="상단 설명" rows={2} value={get("sauce.lead")} onChange={(v) => set("sauce.lead", v)} />
          {groupList("sauce.groups")}
          <ImagePick label="오른쪽 사진" value={get("sauce.image")} onChange={(v) => set("sauce.image", v)} onRemove={() => set("sauce.image", "")} />
        </>
      )}

      {sub === "noodle" && (
        <>
          <TextArea label="상단 한 줄 설명" rows={2} value={get("noodle.lead")} onChange={(v) => set("noodle.lead", v)} />
          <TextArea label="소개 본문" rows={6} value={get("noodle.intro")} onChange={(v) => set("noodle.intro", v)} />
          <TextArea label="강조 인용문" rows={3} value={get("noodle.quote")} onChange={(v) => set("noodle.quote", v)} />
          <Text label="원료 설명 제목" value={get("noodle.riceTitle")} onChange={(v) => set("noodle.riceTitle", v)} />
          <TextArea label="원료 설명 본문" rows={8} value={get("noodle.riceBody")} onChange={(v) => set("noodle.riceBody", v)} />
          <CardList
            label="열량 비교표"
            value={data.noodle.kcal}
            onChange={(v) => set("noodle.kcal", v)}
            blank={() => ({ key: "", value: "", highlight: false })}
            addLabel="+ 줄 추가"
            render={(r: any, s) => (
              <div className="grid items-end gap-x-5 sm:grid-cols-[1fr_140px_100px]">
                <Text label="항목" value={r.key} onChange={(x) => s({ key: x })} />
                <Text label="열량" value={r.value} onChange={(x) => s({ value: x })} />
                <Field label="강조">
                  <label className="flex h-[42px] items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={!!r.highlight}
                      onChange={(e) => s({ highlight: e.target.checked })}
                      className="h-4 w-4 accent-[#e8261e]"
                    />
                    빨갛게
                  </label>
                </Field>
              </div>
            )}
          />
          <div className="grid gap-x-6 sm:grid-cols-2">
            <Text label="원료 강조 제목" value={get("noodle.ingredientTitle")} onChange={(v) => set("noodle.ingredientTitle", v)} />
            <Text label="냉동 강조 제목" value={get("noodle.freezeTitle")} onChange={(v) => set("noodle.freezeTitle", v)} />
          </div>
          <TextArea label="원료 강조 본문" rows={4} value={get("noodle.ingredientBody")} onChange={(v) => set("noodle.ingredientBody", v)} />
          <TextArea label="냉동 강조 본문" rows={4} value={get("noodle.freezeBody")} onChange={(v) => set("noodle.freezeBody", v)} />
          <Text label="강점 제목" value={get("noodle.strengthTitle")} onChange={(v) => set("noodle.strengthTitle", v)} />
          <StringList label="강점 목록" value={data.noodle.strengths} onChange={(v) => set("noodle.strengths", v)} />
          {imgList("noodle.images", "사진 (순서대로 본문 사이에 들어갑니다)")}
        </>
      )}

      {sub === "seafood" && (
        <>
          <Text label="제목" value={get("seafood.title")} onChange={(v) => set("seafood.title", v)} />
          <CardList
            label="제품"
            value={data.seafood.items}
            onChange={(v) => set("seafood.items", v)}
            blank={() => ({ name: "", image: "" })}
            addLabel="+ 제품 추가"
            render={(it: any, s) => (
              <>
                <Text label="제품명" value={it.name} onChange={(x) => s({ name: x })} />
                <ImagePick label="사진" value={it.image} onChange={(x) => s({ image: x })} />
              </>
            )}
          />
          <ImagePick label="아래 큰 이미지" value={get("seafood.heroImage")} onChange={(v) => set("seafood.heroImage", v)} onRemove={() => set("seafood.heroImage", "")} />
        </>
      )}

      {sub === "etc" && (
        <>
          <CardList
            label="제품"
            value={data.etc.items}
            onChange={(v) => set("etc.items", v)}
            blank={() => ({ name: "", spec: "", image: "" })}
            addLabel="+ 제품 추가"
            render={(it: any, s) => (
              <>
                <div className="grid gap-x-5 sm:grid-cols-2">
                  <Text label="제품명" value={it.name} onChange={(x) => s({ name: x })} />
                  <Text label="규격" value={it.spec} onChange={(x) => s({ spec: x })} />
                </div>
                <ImagePick label="사진" value={it.image} onChange={(x) => s({ image: x })} />
              </>
            )}
          />
          <TextArea label="아래 안내 문구" rows={2} value={get("etc.note")} onChange={(v) => set("etc.note", v)} />
        </>
      )}
    </>
  );
}

function SupportTab({ data, get, set }: TabProps) {
  return (
    <>
      <H>OEM 견적 신청</H>
      <Text label="페이지 제목" value={get("oem.title")} onChange={(v) => set("oem.title", v)} />
      <TextArea label="상단 설명" rows={2} value={get("oem.lead")} onChange={(v) => set("oem.lead", v)} />
      <StringList label="문의 종류 선택지" value={data.oem.types} onChange={(v) => set("oem.types", v)} />
      <TextArea label="내용란 안내 문구" rows={2} value={get("oem.messageHelp")} onChange={(v) => set("oem.messageHelp", v)} />
      <TextArea label="개인정보 동의 문구" rows={3} value={get("oem.privacyText")} onChange={(v) => set("oem.privacyText", v)} />
      <StringList label="진행 절차" value={data.oem.steps} onChange={(v) => set("oem.steps", v)} />
      <Text label="상담 가능 시간" value={get("oem.officeHours")} onChange={(v) => set("oem.officeHours", v)} />

      <H>문의하기</H>
      <TextArea label="상단 설명" rows={2} value={get("contact.lead")} onChange={(v) => set("contact.lead", v)} />
      <Text label="안내 상자 제목" value={get("contact.ctaTitle")} onChange={(v) => set("contact.ctaTitle", v)} />
      <TextArea label="안내 상자 설명" rows={3} value={get("contact.ctaDesc")} onChange={(v) => set("contact.ctaDesc", v)} />
      <TextArea label="맨 아래 참고 문구" hint="비우면 표시되지 않습니다" rows={3} value={get("contact.note")} onChange={(v) => set("contact.note", v)} />
    </>
  );
}
