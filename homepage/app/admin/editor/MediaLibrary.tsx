"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "./types";

/** 사진·영상 보관함 — 한 번 올린 파일을 다시 쓸 수 있다. */
export default function MediaLibrary({
  media,
  onAddMedia,
  onPick,
  onClose,
  browseOnly,
}: {
  media: MediaItem[];
  onAddMedia: (items: MediaItem[]) => void;
  onPick: (url: string) => void;
  onClose: () => void;
  browseOnly?: boolean;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [serverFiles, setServerFiles] = useState<MediaItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* 실제 uploads 폴더의 파일도 함께 보여준다 (기록이 없어도 재사용 가능하도록) */
  useEffect(() => {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((j) => setServerFiles(j.items ?? []))
      .catch(() => setServerFiles([]));
  }, []);

  const all: MediaItem[] = (() => {
    const map = new Map<string, MediaItem>();
    for (const m of serverFiles ?? []) map.set(m.url, m);
    for (const m of media) map.set(m.url, { ...map.get(m.url), ...m });
    return [...map.values()].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  })();

  const shown = all
    .filter((m) => (filter === "all" ? true : m.type === filter))
    .filter((m) => (q ? (m.name + m.url).toLowerCase().includes(q.toLowerCase()) : true));

  const upload = async (files: FileList | File[]) => {
    setErr("");
    const list = [...files];
    setBusy(list.length);
    const added: MediaItem[] = [];
    for (const file of list) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        const r = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: file.name, type: file.type, data: btoa(bin) }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "업로드 실패");
        added.push({
          url: j.url,
          name: file.name,
          type: file.type.startsWith("video") ? "video" : "image",
          size: file.size,
          at: new Date().toISOString(),
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (added.length) {
      onAddMedia(added);
      setServerFiles((prev) => [...added, ...(prev ?? [])]);
      if (!browseOnly && added.length === 1) onPick(added[0].url);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="flex max-h-[82vh] w-full max-w-[860px] flex-col rounded-xl border border-[#2a2e34] bg-[#15181c]"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) void upload(e.dataTransfer.files);
        }}
      >
        <div className="flex items-center gap-3 border-b border-[#2a2e34] px-5 py-4">
          <h2 className="text-[15px] font-extrabold text-[#e8eaed]">사진·영상 보관함</h2>
          <div className="ml-2 flex gap-0.5 rounded-md bg-[#1a1d21] p-0.5">
            {([["all", "전체"], ["image", "사진"], ["video", "영상"]] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilter(v)}
                className={`rounded px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                  filter === v ? "bg-[#2a2e34] text-[#e8eaed]" : "text-[#7b828c] hover:text-[#c8ccd2]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="파일 이름 검색"
            className="ml-auto w-[180px] rounded-md border border-[#2a2e34] bg-[#101317] px-2.5 py-1.5 text-[12.5px] text-[#e8eaed] outline-none focus:border-[#e8261e] placeholder:text-[#5c636d]"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-[#e8261e] px-3.5 py-1.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#c41c15]"
          >
            올리기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-[#7b828c] transition-colors hover:bg-[#22262b] hover:text-[#e8eaed]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = "";
          }}
        />

        <div className={`min-h-0 flex-1 overflow-y-auto p-5 ${drag ? "bg-[#e8261e]/10" : ""}`}>
          {busy > 0 && (
            <p className="mb-3 text-[12.5px] font-bold text-[#fbbf24]">{busy}개 올리는 중...</p>
          )}
          {err && <p className="mb-3 text-[12.5px] font-bold text-[#ff6a5e]">{err}</p>}
          {drag && <p className="mb-3 text-[13px] font-bold text-[#ff8a80]">여기에 놓으면 올라갑니다</p>}

          {shown.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <p className="text-[13px] font-bold text-[#c8ccd2]">아직 올린 파일이 없습니다</p>
              <p className="mt-1.5 text-[12px] text-[#7b828c]">
                위 [올리기] 를 누르거나, 파일을 이 창에 끌어다 놓으세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {shown.map((m) => (
                <button
                  key={m.url}
                  type="button"
                  onClick={() => !browseOnly && onPick(m.url)}
                  className={`group overflow-hidden rounded-lg border border-[#2a2e34] bg-[#101317] text-left transition-colors ${
                    browseOnly ? "cursor-default" : "hover:border-[#e8261e]"
                  }`}
                >
                  <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-[#0b0d10]">
                    {m.type === "video" ? (
                      <video src={m.url} muted className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-[11px] text-[#9aa1ab] group-hover:text-[#e8eaed]">
                    {m.name || m.url.split("/").pop()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {!browseOnly && (
          <div className="border-t border-[#2a2e34] px-5 py-3 text-[12px] text-[#7b828c]">
            파일을 클릭하면 선택한 자리에 들어갑니다.
          </div>
        )}
      </div>
    </div>
  );
}
