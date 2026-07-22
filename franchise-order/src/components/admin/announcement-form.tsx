"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";

export function AnnouncementForm({ stores, brands }: { stores: { id: string; name: string }[]; brands: { id: string; name: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2"><Label>제목</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></div>
        <div className="md:col-span-2"><Label>내용</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} /></div>
        <div><Label>노출 종료일 (선택)</Label><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></div>
        <div className="flex items-end gap-4 pb-1 text-sm">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="h-4 w-4 accent-orange-500" /> 상단 고정</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} className="h-4 w-4 accent-orange-500" /> 중요</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={targetAll} onChange={(e) => setTargetAll(e.target.checked)} className="h-4 w-4 accent-orange-500" /> 전체 대상</label>
        </div>
      </div>

      {!targetAll && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <Label>대상 브랜드</Label>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-sm">
                  <input type="checkbox" checked={brandIds.includes(b.id)} className="h-3.5 w-3.5 accent-orange-500"
                    onChange={(e) => setBrandIds((prev) => e.target.checked ? [...prev, b.id] : prev.filter((x) => x !== b.id))} />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>대상 가맹점</Label>
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {stores.map((s) => (
                <label key={s.id} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-sm">
                  <input type="checkbox" checked={storeIds.includes(s.id)} className="h-3.5 w-3.5 accent-orange-500"
                    onChange={(e) => setStoreIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
      <Button
        className="mt-4" disabled={pending || !title.trim() || !body.trim()}
        onClick={() => startTransition(async () => {
          const r = await createAnnouncementAction({
            title: title.trim(), body: body.trim(), isPinned, isImportant,
            endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
            targetAll, targetStoreIds: storeIds, targetBrandIds: brandIds,
          });
          if (r.ok) { setMsg("등록되었습니다."); setTitle(""); setBody(""); router.refresh(); }
          else setMsg(r.error ?? "등록 실패");
        })}
      >
        {pending ? "등록 중..." : "공지 등록"}
      </Button>
    </div>
  );
}

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <button className="text-danger underline" onClick={() => setConfirming(true)}>삭제</button>;
  return (
    <span className="flex gap-2">
      <button className="font-semibold text-danger underline" disabled={pending}
        onClick={() => startTransition(async () => { await deleteAnnouncementAction(id); router.refresh(); })}>
        정말 삭제
      </button>
      <button className="underline" onClick={() => setConfirming(false)}>취소</button>
    </span>
  );
}
