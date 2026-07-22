"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { CLAIM_TYPE_LABEL, CLAIM_RESOLUTION_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { createClaimAction } from "@/app/app/actions";
import { cn } from "@/lib/utils";

export function ClaimForm({ orderId, items }: { orderId: string; items: { id: string; qty: number; name: string }[] }) {
  const router = useRouter();
  const [claimType, setClaimType] = useState("SHORTAGE");
  const [resolution, setResolution] = useState("REDELIVERY");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CheckCircle2 size={52} className="text-success" />
        <h2 className="mt-4 text-lg font-bold">클레임이 접수되었습니다</h2>
        <p className="mt-1 text-sm text-muted">접수번호 {done}</p>
        <Button className="mt-6" onClick={() => router.push("/app/orders")}>주문내역으로</Button>
      </div>
    );
  }

  const toggle = (id: string, maxQty: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, maxQty);
      return next;
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div>
        <Label>대상 상품</Label>
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => toggle(it.id, it.qty)}
                className={cn("flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm",
                  selected.has(it.id) ? "border-primary bg-primary-light" : "border-border bg-white")}
              >
                <span className="min-w-0 truncate font-medium">{it.name}</span>
                <span className="ml-2 shrink-0 text-xs text-muted">주문 {it.qty}개</span>
              </button>
              {selected.has(it.id) && (
                <div className="mt-1.5 flex items-center gap-2 px-1">
                  <span className="text-xs text-muted">문제 수량</span>
                  <Input
                    type="number" inputMode="numeric" className="h-9 w-20 text-center"
                    value={selected.get(it.id)}
                    min={1} max={it.qty}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(it.qty, parseInt(e.target.value || "1", 10)));
                      setSelected((prev) => new Map(prev).set(it.id, v));
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>클레임 유형</Label>
          <Select value={claimType} onChange={(e) => setClaimType(e.target.value)}>
            {Object.entries(CLAIM_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div>
          <Label>희망 처리</Label>
          <Select value={resolution} onChange={(e) => setResolution(e.target.value)}>
            {Object.entries(CLAIM_RESOLUTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <Label>사유</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="예: 박스 파손으로 내용물 손상" />
      </div>
      <div>
        <Label>상세 내용 (선택)</Label>
        <Textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={2000} placeholder="상세한 상황을 입력해주세요" />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

      <Button
        size="lg" className="w-full"
        disabled={pending || selected.size === 0 || !reason.trim()}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await createClaimAction({
              orderId,
              claimType: claimType as "SHORTAGE",
              resolution: resolution as "REDELIVERY",
              reason: reason.trim(),
              detail: detail.trim() || undefined,
              items: [...selected.entries()].map(([orderItemId, qty]) => ({ orderItemId, qty })),
            });
            if (r.ok) setDone(r.claimNo ?? "");
            else setError(r.error ?? "등록에 실패했습니다.");
          })
        }
      >
        {pending ? "등록 중..." : "클레임 등록"}
      </Button>
    </div>
  );
}
