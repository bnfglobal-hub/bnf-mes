"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestCancelAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function CancelRequestButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="danger-outline" className="w-full" onClick={() => setOpen(true)}>
        주문 취소 요청
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
      <p className="mb-2 text-sm font-semibold">취소 사유를 입력해주세요</p>
      <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 주문 실수" />
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="outline" className="flex-1" disabled={pending} onClick={() => setOpen(false)}>닫기</Button>
        <Button
          variant="danger" className="flex-1" disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await requestCancelAction(orderId, reason);
              if (r.ok) { setOpen(false); router.refresh(); }
              else setError(r.error ?? "실패했습니다.");
            })
          }
        >
          {pending ? "요청 중..." : "취소 요청"}
        </Button>
      </div>
    </div>
  );
}
