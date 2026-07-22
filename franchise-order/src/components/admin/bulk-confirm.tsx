"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkConfirmAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function BulkConfirmBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    const ids = [...(ref.current?.querySelectorAll<HTMLInputElement>("input[data-bulk-id]:checked") ?? [])].map(
      (el) => el.dataset.bulkId!
    );
    if (ids.length === 0) { setMsg("확정할 주문을 선택하세요 (발주 접수 상태만 가능)"); return; }
    startTransition(async () => {
      const r = await bulkConfirmAction(ids);
      setMsg(`확정 ${r.confirmed}건${r.failed ? `, 실패 ${r.failed}건` : ""} — ERP 전송 큐에 등록되었습니다.`);
      router.refresh();
    });
  };

  return (
    <div ref={ref}>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={run} disabled={pending}>{pending ? "확정 중..." : "선택 일괄 확정"}</Button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
      {children}
    </div>
  );
}
